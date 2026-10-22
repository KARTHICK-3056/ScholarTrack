from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from database import get_db
from adapters.source_alpha import SourceAlphaAdapter
from adapters.source_beta import SourceBetaAdapter
from adapters.base import ScrapeFailureException, logger

# Global adapter registry
adapters = {
    "source_alpha": SourceAlphaAdapter(),
    "source_beta": SourceBetaAdapter(),
}

def get_now_utc() -> str:
    """Returns current UTC timestamp in ISO-8601 format."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def refresh_source(source_id: str, db_path: str = None) -> Dict[str, Any]:
    """
    Executes collector adapter scrape, handles idempotent upserts,
    computes SHA-256 hashes, detects deadline revisions,
    and updates source diagnostic status.
    """
    if source_id not in adapters:
        raise ValueError(f"Unknown source adapter '{source_id}'")

    adapter = adapters[source_id]
    now = get_now_utc()

    with get_db(db_path) as conn:
        try:
            # 1. Fetch & parse notices using adapter
            html_content = adapter.fetch_html()
            notices = adapter.parse_notices(html_content)

            # 2. Update source status to HEALTHY
            conn.execute(
                """
                UPDATE sources
                SET last_checked_at = ?, last_status = 'HEALTHY', failure_reason = NULL
                WHERE source_id = ?
                """,
                (now, source_id),
            )

            upsert_stats = {"created": 0, "revised": 0, "unchanged": 0}

            # 3. Process each parsed notice idempotently
            for item in notices:
                notice_id = item["notice_id"]
                cursor = conn.execute("SELECT * FROM notices WHERE notice_id = ?", (notice_id,))
                existing = cursor.fetchone()

                if existing is None:
                    # New notice creation
                    conn.execute(
                        """
                        INSERT INTO notices (
                            notice_id, source_id, url, notice_type, title, provider,
                            education_level, discipline, region, benefit_text,
                            eligibility_excerpt, due_at, timezone, captured_at,
                            verified_at, content_hash, notice_status,
                            previous_deadline, updated_deadline
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            notice_id,
                            source_id,
                            item["url"],
                            item["notice_type"],
                            item["title"],
                            item["provider"],
                            item["education_level"],
                            item["discipline"],
                            item["region"],
                            item["benefit_text"],
                            item["eligibility_excerpt"],
                            item["due_at"],
                            item["timezone"],
                            now,
                            now,
                            item["content_hash"],
                            item["notice_status"],
                            None,
                            None,
                        ),
                    )
                    upsert_stats["created"] += 1
                else:
                    existing_due = existing["due_at"]
                    new_due = item["due_at"]
                    existing_hash = existing["content_hash"]
                    new_hash = item["content_hash"]

                    # Check for deadline change
                    if existing_due != new_due:
                        # Version-aware revision detected!
                        logger.info(
                            f"[REVISION] Notice '{notice_id}' deadline changed: {existing_due} -> {new_due}"
                        )
                        prev_deadline = existing_due
                        updated_deadline = new_due

                        conn.execute(
                            """
                            UPDATE notices
                            SET url = ?, notice_type = ?, title = ?, provider = ?,
                                education_level = ?, discipline = ?, region = ?,
                                benefit_text = ?, eligibility_excerpt = ?,
                                due_at = ?, timezone = ?, verified_at = ?,
                                content_hash = ?, notice_status = 'REVISED',
                                previous_deadline = ?, updated_deadline = ?
                            WHERE notice_id = ?
                            """,
                            (
                                item["url"],
                                item["notice_type"],
                                item["title"],
                                item["provider"],
                                item["education_level"],
                                item["discipline"],
                                item["region"],
                                item["benefit_text"],
                                item["eligibility_excerpt"],
                                new_due,
                                item["timezone"],
                                now,
                                new_hash,
                                prev_deadline,
                                updated_deadline,
                                notice_id,
                            ),
                        )

                        # Insert deduplicated change history
                        conn.execute(
                            """
                            INSERT INTO change_history (
                                notice_id, previous_deadline, updated_deadline,
                                previous_status, new_status, detected_at, alert_sent
                            ) VALUES (?, ?, ?, ?, 'REVISED', ?, 1)
                            """,
                            (
                                notice_id,
                                prev_deadline,
                                updated_deadline,
                                existing["notice_status"],
                                now,
                            ),
                        )
                        upsert_stats["revised"] += 1
                    else:
                        # Deadlines match. If content changed or identical:
                        conn.execute(
                            """
                            UPDATE notices
                            SET url = ?, notice_type = ?, title = ?, provider = ?,
                                education_level = ?, discipline = ?, region = ?,
                                benefit_text = ?, eligibility_excerpt = ?,
                                timezone = ?, verified_at = ?, content_hash = ?,
                                notice_status = CASE WHEN notice_status = 'STALE' THEN 'CONFIRMED' ELSE notice_status END
                            WHERE notice_id = ?
                            """,
                            (
                                item["url"],
                                item["notice_type"],
                                item["title"],
                                item["provider"],
                                item["education_level"],
                                item["discipline"],
                                item["region"],
                                item["benefit_text"],
                                item["eligibility_excerpt"],
                                item["timezone"],
                                now,
                                new_hash,
                                notice_id,
                            ),
                        )
                        upsert_stats["unchanged"] += 1

            return {
                "source_id": source_id,
                "status": "HEALTHY",
                "checked_at": now,
                "stats": upsert_stats,
            }

        except ScrapeFailureException as ex:
            error_msg = str(ex)
            logger.error(f"[FAILURE] Source '{source_id}' scrape failed: {error_msg}")

            # Mark source as FAILED
            conn.execute(
                """
                UPDATE sources
                SET last_checked_at = ?, last_status = 'FAILED', failure_reason = ?
                WHERE source_id = ?
                """,
                (now, error_msg, source_id),
            )

            # Mark all existing notices from this source as STALE snapshots
            conn.execute(
                """
                UPDATE notices
                SET notice_status = 'STALE'
                WHERE source_id = ?
                """,
                (source_id,),
            )

            return {
                "source_id": source_id,
                "status": "FAILED",
                "checked_at": now,
                "error": error_msg,
            }

def seed_all_sources(db_path: str = None) -> Dict[str, Any]:
    """Refreshes all registered sources to seed database with standard fixtures."""
    results = {}
    for sid in adapters.keys():
        results[sid] = refresh_source(sid, db_path=db_path)
    return results
