import sqlite3
import os
from contextlib import contextmanager
from typing import Generator

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "scholartrack.db")
MIGRATION_FILE = os.path.join(BASE_DIR, "migrations", "001_init.sql")

def get_connection(db_path: str = None) -> sqlite3.Connection:
    target_path = db_path or os.getenv("SCHOLARTRACK_DB_PATH", DEFAULT_DB_PATH)
    conn = sqlite3.connect(target_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db(db_path: str = None) -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db(db_path: str = None) -> None:
    """Runs raw SQL migration to initialize tables transparently."""
    with get_db(db_path) as conn:
        with open(MIGRATION_FILE, "r", encoding="utf-8") as f:
            sql_script = f.read()
        conn.executescript(sql_script)

        # Seed initial sources if missing
        sources = [
            (
                "source_alpha",
                "National Scholarship Portal & Central Ministries (NSP / MoE)",
                "https://scholarships.gov.in",
                "source_alpha",
                1,
                "HEALTHY",
                None
            ),
            (
                "source_beta",
                "Apex Councils & Foundations (CSIR, Reliance, Inlaks)",
                "https://csirhrdg.res.in",
                "source_beta",
                1,
                "HEALTHY",
                None
            ),
        ]
        for s in sources:
            conn.execute(
                """
                INSERT INTO sources (source_id, name, base_url, adapter_type, robots_compliant, last_status, failure_reason)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(source_id) DO UPDATE SET
                    name = excluded.name,
                    base_url = excluded.base_url,
                    adapter_type = excluded.adapter_type
                """,
                s,
            )

def reset_db(db_path: str = None) -> None:
    """Drops and re-creates database cleanly for reproducible mentor evaluations."""
    target_path = db_path or os.getenv("SCHOLARTRACK_DB_PATH", DEFAULT_DB_PATH)
    if os.path.exists(target_path) and target_path != ":memory:":
        try:
            os.remove(target_path)
        except Exception:
            pass
    init_db(target_path)
