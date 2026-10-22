import os
import sys
import tempfile
import pytest
from datetime import datetime, timezone

# Add backend directory to path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from database import init_db, get_db
from services import adapters, refresh_source, seed_all_sources
from main import app, parse_iso_to_utc
from fastapi.testclient import TestClient

@pytest.fixture(autouse=True)
def setup_test_database():
    """Creates an isolated temporary SQLite database for each test run."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        test_db_path = tmp.name

    os.environ["SCHOLARTRACK_DB_PATH"] = test_db_path
    init_db(test_db_path)

    # Reset adapters to standard mode
    for adapter in adapters.values():
        adapter.toggle_outage(False)
        adapter.set_fixture_mode("standard")

    yield test_db_path

    # Teardown
    try:
        if os.path.exists(test_db_path):
            os.remove(test_db_path)
    except Exception:
        pass


def test_1_unknown_deadline_never_coerced_to_arbitrary_date(setup_test_database):
    """
    Acceptance Test 1:
    Unknown deadline is never converted to an arbitrary date (due_at remains None/NULL).
    """
    db_path = setup_test_database
    # Switch Source Beta to unknown deadline fixture
    adapters["source_beta"].set_fixture_mode("unknown")
    res = refresh_source("source_beta", db_path=db_path)
    assert res["status"] == "HEALTHY"

    with get_db(db_path) as conn:
        cursor = conn.execute("SELECT * FROM notices WHERE notice_id = 'csir-ugc-net-jrf'")
        notice = cursor.fetchone()
        assert notice is not None, "Rolling unknown notice must be captured"
        assert notice["due_at"] is None, "Unknown deadline MUST remain NULL/None; never coerce to an arbitrary date"
        assert "CSIR-UGC NET" in notice["title"]

    # Verify via API
    client = TestClient(app)
    response = client.get("/api/notices")
    assert response.status_code == 200
    data = response.json()
    rolling = next((n for n in data["notices"] if n["notice_id"] == "csir-ugc-net-jrf"), None)
    assert rolling is not None
    assert rolling["due_at"] is None


def test_2_source_correction_updates_existing_notice_and_logs_change(setup_test_database):
    """
    Acceptance Test 2:
    A source correction updates the existing notice in-place and logs previous_deadline -> updated_deadline
    rather than creating a duplicate row.
    """
    db_path = setup_test_database
    # Initial scrape with standard fixture
    adapters["source_alpha"].set_fixture_mode("standard")
    refresh_source("source_alpha", db_path=db_path)

    with get_db(db_path) as conn:
        cursor = conn.execute("SELECT COUNT(*) as cnt FROM notices WHERE notice_id = 'aicte-pragati-swanath'")
        assert cursor.fetchone()["cnt"] == 1
        cursor = conn.execute("SELECT due_at, notice_status FROM notices WHERE notice_id = 'aicte-pragati-swanath'")
        initial = cursor.fetchone()
        assert initial["due_at"] == "2026-10-31T18:29:59Z"
        assert initial["notice_status"] == "CONFIRMED"

    # Now scrape with revised fixture (deadline extended to 2026-11-20T18:29:59Z)
    adapters["source_alpha"].set_fixture_mode("revised")
    refresh_result = refresh_source("source_alpha", db_path=db_path)
    assert refresh_result["stats"]["revised"] == 1

    with get_db(db_path) as conn:
        # Check no duplicate notice row was created
        cursor = conn.execute("SELECT COUNT(*) as cnt FROM notices WHERE notice_id = 'aicte-pragati-swanath'")
        assert cursor.fetchone()["cnt"] == 1, "Must update in-place, never create duplicate notice row"

        cursor = conn.execute("SELECT * FROM notices WHERE notice_id = 'aicte-pragati-swanath'")
        updated = cursor.fetchone()
        assert updated["due_at"] == "2026-11-20T18:29:59Z"
        assert updated["previous_deadline"] == "2026-10-31T18:29:59Z"
        assert updated["updated_deadline"] == "2026-11-20T18:29:59Z"
        assert updated["notice_status"] == "REVISED"

        # Check change_history logged exactly once
        cursor = conn.execute("SELECT * FROM change_history WHERE notice_id = 'aicte-pragati-swanath'")
        history = cursor.fetchall()
        assert len(history) == 1
        assert history[0]["previous_deadline"] == "2026-10-31T18:29:59Z"
        assert history[0]["updated_deadline"] == "2026-11-20T18:29:59Z"
        assert history[0]["new_status"] == "REVISED"
        assert history[0]["alert_sent"] == 1


def test_3_date_filters_evaluate_accurately_across_timezones(setup_test_database):
    """
    Acceptance Test 3:
    Date filters evaluate accurately across different timezones.
    """
    db_path = setup_test_database
    adapters["source_alpha"].set_fixture_mode("standard")
    refresh_source("source_alpha", db_path=db_path)

    # Notice 'aicte-pragati-swanath' is due at '2026-10-31T18:29:59Z'
    # 'dst-inspire-she-aorc' is due at '2026-11-30T18:29:59Z'
    client = TestClient(app)

    # Case A: Filter using IST (+05:30).
    # '2026-11-01T00:00:00+05:30' converts to '2026-10-31T18:30:00Z', matches AICTE Pragati
    res_ist = client.get("/api/notices?due_before=2026-11-01T00:00:00%2B05:30")
    assert res_ist.status_code == 200
    ids_ist = [n["notice_id"] for n in res_ist.json()["notices"]]
    assert "aicte-pragati-swanath" in ids_ist
    assert "dst-inspire-she-aorc" not in ids_ist

    # Case B: Filter using EST (-05:00).
    # '2026-10-31T12:00:00-05:00' converts to '2026-10-31T17:00:00Z' (which is BEFORE 18:29:59Z)
    res_est = client.get("/api/notices?due_before=2026-10-31T12:00:00-05:00")
    assert res_est.status_code == 200
    ids_est = [n["notice_id"] for n in res_est.json()["notices"]]
    assert "aicte-pragati-swanath" not in ids_est

    # Case C: ISO string helper check
    utc_converted = parse_iso_to_utc("2026-11-02T05:30:00+05:30")
    assert utc_converted == "2026-11-02T00:00:00Z"


def test_4_inaccessible_source_flagged_as_failed(setup_test_database):
    """
    Acceptance Test 4:
    Inaccessible source is flagged as FAILED instead of silently skipped,
    and notices are marked as STALE snapshots.
    """
    db_path = setup_test_database
    # First seed standard data
    refresh_source("source_alpha", db_path=db_path)

    # Now simulate outage
    adapters["source_alpha"].toggle_outage(True, "HTTP 503 Service Unavailable")
    result = refresh_source("source_alpha", db_path=db_path)
    assert result["status"] == "FAILED"
    assert "503" in result["error"]

    with get_db(db_path) as conn:
        cursor = conn.execute("SELECT * FROM sources WHERE source_id = 'source_alpha'")
        source_row = cursor.fetchone()
        assert source_row["last_status"] == "FAILED"
        assert "503" in source_row["failure_reason"]

        # Honest freshness label: existing notices marked STALE
        cursor = conn.execute("SELECT notice_status FROM notices WHERE source_id = 'source_alpha'")
        statuses = [r["notice_status"] for r in cursor.fetchall()]
        assert all(s == "STALE" for s in statuses)

    # Verify via API
    client = TestClient(app)
    src_res = client.get("/api/sources")
    assert src_res.status_code == 200
    src_alpha = next(s for s in src_res.json()["sources"] if s["source_id"] == "source_alpha")
    assert src_alpha["last_status"] == "FAILED"


def test_5_every_notice_stores_and_exposes_valid_source_url(setup_test_database):
    """
    Acceptance Test 5:
    Every notice stores and exposes a valid source URL.
    """
    db_path = setup_test_database
    seed_all_sources(db_path=db_path)

    client = TestClient(app)
    res = client.get("/api/notices")
    assert res.status_code == 200
    notices = res.json()["notices"]
    assert len(notices) >= 5

    for n in notices:
        assert "url" in n
        url = n["url"]
        assert url is not None and isinstance(url, str)
        assert url.startswith("http://") or url.startswith("https://"), f"Invalid notice URL: {url}"


def test_6_repeated_identical_scrapes_do_not_trigger_duplicate_alerts(setup_test_database):
    """
    Acceptance Test 6:
    Repeated identical scrapes do not trigger duplicate alerts (idempotent deduplication).
    """
    db_path = setup_test_database
    # First scrape
    res1 = refresh_source("source_alpha", db_path=db_path)
    assert res1["stats"]["created"] == 3

    with get_db(db_path) as conn:
        c1 = conn.execute("SELECT COUNT(*) as cnt FROM change_history").fetchone()["cnt"]
        assert c1 == 0, "Initial creation does not produce revision alerts"

    # Second identical scrape
    res2 = refresh_source("source_alpha", db_path=db_path)
    assert res2["stats"]["created"] == 0
    assert res2["stats"]["revised"] == 0
    assert res2["stats"]["unchanged"] == 3

    # Third identical scrape
    res3 = refresh_source("source_alpha", db_path=db_path)
    assert res3["stats"]["unchanged"] == 3

    with get_db(db_path) as conn:
        c2 = conn.execute("SELECT COUNT(*) as cnt FROM change_history").fetchone()["cnt"]
        assert c2 == 0, "Identical scrapes MUST NOT create duplicate alerts in change_history"
