import sys
import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db, reset_db, get_db
from services import adapters, refresh_source, seed_all_sources, get_now_utc
from adapters.base import logger

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes SQLite database and seeds standard fixtures."""
    logger.info("[STARTUP] Running migrations and seeding fixtures...")
    init_db()
    with get_db() as conn:
        cursor = conn.execute("SELECT COUNT(*) as cnt FROM notices")
        cnt = cursor.fetchone()["cnt"]
        if cnt == 0:
            seed_all_sources()
            logger.info("[STARTUP] Seeded standard notices successfully.")
    yield

app = FastAPI(
    title="ScholarTrack (WEB-02) API",
    description="Scholarship & Fellowship Deadline Tracker with Idempotent Scrapers and Timezone Normalization",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class ReviseDeadlineRequest(BaseModel):
    notice_id: str = "aicte-pragati-swanath"
    new_deadline: str = "2026-11-20T18:29:59Z"
    reason: Optional[str] = "Official Ministry Extension"

class InjectTimezoneRequest(BaseModel):
    notice_id: str = "pmrf-doctoral-fellowship"
    timezone: str = "Asia/Tokyo"
    new_deadline: str = "2026-11-28T18:29:00Z"

class SimulateOutageRequest(BaseModel):
    source_id: str = "source_alpha"
    simulate: bool = True
    reason: Optional[str] = "HTTP 503 Service Unavailable: upstream server timeout"

def parse_iso_to_utc(iso_str: str) -> str:
    """Parses any timezone-aware ISO-8601 string and returns UTC ISO format."""
    normalized = iso_str.strip().replace("Z", "+00:00")
    dt = datetime.fromisoformat(normalized)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    utc_dt = dt.astimezone(timezone.utc)
    return utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "ScholarTrack (WEB-02)", "timestamp": get_now_utc()}

@app.get("/api/notices")
def get_notices(
    q: Optional[str] = Query(None, description="Search keyword in title, provider, discipline"),
    education_level: Optional[str] = Query(None),
    discipline: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    notice_type: Optional[str] = Query(None, pattern="^(Scholarship|Fellowship)$"),
    confirmed_only: bool = Query(False, description="Exclude notices with unknown or null deadlines"),
    due_before: Optional[str] = Query(None, description="Timezone-aware ISO timestamp filter"),
    due_after: Optional[str] = Query(None, description="Timezone-aware ISO timestamp filter"),
):
    with get_db() as conn:
        sql = """
            SELECT n.*, s.name as source_name, s.last_status as source_status, s.failure_reason as source_failure_reason
            FROM notices n
            JOIN sources s ON n.source_id = s.source_id
            WHERE 1=1
        """
        params = []

        if q:
            search_param = f"%{q.strip()}%"
            sql += """ AND (
                n.title LIKE ? OR
                n.provider LIKE ? OR
                n.discipline LIKE ? OR
                n.benefit_text LIKE ? OR
                n.eligibility_excerpt LIKE ?
            )"""
            params.extend([search_param] * 5)

        if education_level and education_level != "All":
            sql += " AND n.education_level LIKE ?"
            params.append(f"%{education_level}%")

        if discipline and discipline != "All":
            sql += " AND n.discipline LIKE ?"
            params.append(f"%{discipline}%")

        if region and region != "All":
            sql += " AND n.region LIKE ?"
            params.append(f"%{region}%")

        if notice_type and notice_type != "All":
            sql += " AND n.notice_type = ?"
            params.append(notice_type)

        if confirmed_only:
            sql += " AND n.due_at IS NOT NULL AND n.notice_status != 'WITHDRAWN'"

        if due_before:
            try:
                utc_before = parse_iso_to_utc(due_before)
                sql += " AND n.due_at IS NOT NULL AND n.due_at <= ?"
                params.append(utc_before)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid due_before format: {str(e)}")

        if due_after:
            try:
                utc_after = parse_iso_to_utc(due_after)
                sql += " AND n.due_at IS NOT NULL AND n.due_at >= ?"
                params.append(utc_after)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid due_after format: {str(e)}")

        sql += " ORDER BY CASE WHEN n.due_at IS NULL THEN 1 ELSE 0 END, n.due_at ASC, n.captured_at DESC"

        cursor = conn.execute(sql, params)
        rows = [dict(row) for row in cursor.fetchall()]
        return {"count": len(rows), "notices": rows}

@app.get("/api/sources")
def get_sources():
    with get_db() as conn:
        cursor = conn.execute("""
            SELECT s.*, COUNT(n.notice_id) as total_notices
            FROM sources s
            LEFT JOIN notices n ON s.source_id = n.source_id
            GROUP BY s.source_id
        """)
        rows = [dict(row) for row in cursor.fetchall()]
        return {"sources": rows}

@app.post("/api/sources/{source_id}/refresh")
def api_refresh_source(source_id: str):
    if source_id not in adapters:
        raise HTTPException(status_code=404, detail=f"Source adapter '{source_id}' not found.")
    result = refresh_source(source_id)
    return result

@app.get("/api/alerts")
def get_alerts():
    with get_db() as conn:
        cursor = conn.execute("""
            SELECT ch.*, n.title as notice_title, n.provider as notice_provider,
                   n.url as notice_url, n.timezone as notice_timezone, s.name as source_name
            FROM change_history ch
            JOIN notices n ON ch.notice_id = n.notice_id
            JOIN sources s ON n.source_id = s.source_id
            ORDER BY ch.detected_at DESC
        """)
        alerts = [dict(row) for row in cursor.fetchall()]
        return {"count": len(alerts), "alerts": alerts}

@app.get("/api/metrics")
def get_metrics():
    with get_db() as conn:
        now = get_now_utc()
        # Closing soon threshold: 14 days from now
        two_weeks_later = (datetime.now(timezone.utc) + timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ")

        # Active verified: confirmed or revised (not withdrawn, not stale)
        cursor_active = conn.execute("SELECT COUNT(*) as cnt FROM notices WHERE notice_status IN ('CONFIRMED', 'REVISED')")
        active_count = cursor_active.fetchone()["cnt"]

        # Closing soon
        cursor_soon = conn.execute(
            "SELECT COUNT(*) as cnt FROM notices WHERE due_at IS NOT NULL AND due_at >= ? AND due_at <= ?",
            (now, two_weeks_later)
        )
        closing_soon_count = cursor_soon.fetchone()["cnt"]

        # Revised deadlines detected
        cursor_revised = conn.execute("SELECT COUNT(*) as cnt FROM change_history")
        revised_count = cursor_revised.fetchone()["cnt"]

        # Sources health
        cursor_sources = conn.execute("SELECT source_id, name, last_status, last_checked_at FROM sources")
        sources_list = [dict(r) for r in cursor_sources.fetchall()]
        all_healthy = all(s["last_status"] == "HEALTHY" for s in sources_list)

        return {
            "active_verified_count": active_count,
            "closing_soon_count": closing_soon_count,
            "revisions_detected_count": revised_count,
            "adapter_sync_health": {
                "all_healthy": all_healthy,
                "sources": sources_list,
                "last_checked_at": max([s["last_checked_at"] or "" for s in sources_list], default=now)
            }
        }

# Mentor Challenge Sandbox Endpoints
@app.post("/api/mentor-challenge/revise-deadline")
def mentor_revise_deadline(req: ReviseDeadlineRequest):
    """
    Simulates a live source revision on an existing notice to prove it updates in-place
    and logs previous_deadline -> updated_deadline in change_history.
    """
    now = get_now_utc()
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM notices WHERE notice_id = ?", (req.notice_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail=f"Notice '{req.notice_id}' not found.")

        prev_deadline = existing["due_at"]
        new_deadline = req.new_deadline

        # In-place update
        conn.execute("""
            UPDATE notices
            SET due_at = ?, previous_deadline = ?, updated_deadline = ?,
                notice_status = 'REVISED', verified_at = ?
            WHERE notice_id = ?
        """, (new_deadline, prev_deadline, new_deadline, now, req.notice_id))

        # Change history log
        conn.execute("""
            INSERT INTO change_history (
                notice_id, previous_deadline, updated_deadline,
                previous_status, new_status, detected_at, alert_sent
            ) VALUES (?, ?, ?, ?, 'REVISED', ?, 1)
        """, (req.notice_id, prev_deadline, new_deadline, existing["notice_status"], now))

        cursor = conn.execute("SELECT * FROM notices WHERE notice_id = ?", (req.notice_id,))
        updated_notice = dict(cursor.fetchone())

        return {
            "message": "Deadline revision applied successfully in-place.",
            "notice_id": req.notice_id,
            "previous_deadline": prev_deadline,
            "updated_deadline": new_deadline,
            "notice": updated_notice,
        }

@app.post("/api/mentor-challenge/inject-timezone")
def mentor_inject_timezone(req: InjectTimezoneRequest):
    """
    Injects/updates a notice with a custom timezone offset to test live timezone conversion.
    """
    now = get_now_utc()
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM notices WHERE notice_id = ?", (req.notice_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail=f"Notice '{req.notice_id}' not found.")

        conn.execute("""
            UPDATE notices
            SET timezone = ?, due_at = ?, verified_at = ?
            WHERE notice_id = ?
        """, (req.timezone, req.new_deadline, now, req.notice_id))

        cursor = conn.execute("SELECT * FROM notices WHERE notice_id = ?", (req.notice_id,))
        return {
            "message": f"Timezone updated to {req.timezone}",
            "notice": dict(cursor.fetchone())
        }

@app.post("/api/mentor-challenge/simulate-outage")
def mentor_simulate_outage(req: SimulateOutageRequest):
    """
    Toggles a source adapter into failure state so the UI flags the inaccessible source
    and marks its notices as Stale Snapshots.
    """
    if req.source_id not in adapters:
        raise HTTPException(status_code=404, detail=f"Source '{req.source_id}' not found.")

    adapter = adapters[req.source_id]
    adapter.toggle_outage(req.simulate, reason=req.reason or "Simulated 503 Gateway Timeout")

    # Trigger refresh to propagate state to database
    result = refresh_source(req.source_id)
    return {
        "source_id": req.source_id,
        "is_outage_simulated": req.simulate,
        "refresh_result": result
    }

@app.post("/api/mentor-challenge/load-fixture-mode")
def mentor_load_fixture_mode(source_id: str, mode: str):
    """
    Loads specific fixture mode ('standard', 'revised', 'unknown', 'outage')
    and executes refresh.
    """
    if source_id not in adapters:
        raise HTTPException(status_code=404, detail=f"Source '{source_id}' not found.")
    adapter = adapters[source_id]
    adapter.set_fixture_mode(mode)
    if mode == "outage":
        adapter.toggle_outage(True, "HTTP 503 Outage Fixture Mode")
    else:
        adapter.toggle_outage(False)
    result = refresh_source(source_id)
    return {"source_id": source_id, "mode": mode, "result": result}

@app.post("/api/mentor-challenge/reset")
def mentor_reset():
    """Resets database and re-seeds standard fixtures for a fresh viva demonstration."""
    for adapter in adapters.values():
        adapter.toggle_outage(False)
        adapter.set_fixture_mode("standard")
    reset_db()
    seed_all_sources()
    return {"message": "Database and adapters reset to default pristine state."}
