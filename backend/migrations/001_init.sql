-- ScholarTrack (WEB-02) Database Migration 001_init.sql
-- Enables strict foreign keys and transparent SQLite schema for Viva presentation

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
    source_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    adapter_type TEXT NOT NULL,
    robots_compliant BOOLEAN NOT NULL DEFAULT 1,
    last_checked_at TEXT,
    last_status TEXT CHECK(last_status IN ('HEALTHY', 'FAILED', 'TIMEOUT')) DEFAULT 'HEALTHY',
    failure_reason TEXT
);

CREATE TABLE IF NOT EXISTS notices (
    notice_id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    url TEXT NOT NULL,
    notice_type TEXT CHECK(notice_type IN ('Scholarship', 'Fellowship')) NOT NULL,
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    education_level TEXT NOT NULL,
    discipline TEXT NOT NULL,
    region TEXT NOT NULL,
    benefit_text TEXT NOT NULL,
    eligibility_excerpt TEXT NOT NULL,
    due_at TEXT, -- ISO-8601 UTC timestamp, explicitly NULLABLE for unknown deadlines
    timezone TEXT NOT NULL DEFAULT 'UTC',
    captured_at TEXT NOT NULL,
    verified_at TEXT NOT NULL,
    content_hash TEXT NOT NULL, -- SHA-256
    notice_status TEXT CHECK(notice_status IN ('CONFIRMED', 'REVISED', 'WITHDRAWN', 'STALE')) DEFAULT 'CONFIRMED',
    previous_deadline TEXT, -- NULLABLE
    updated_deadline TEXT,  -- NULLABLE
    FOREIGN KEY (source_id) REFERENCES sources(source_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS change_history (
    change_id INTEGER PRIMARY KEY AUTOINCREMENT,
    notice_id TEXT NOT NULL,
    previous_deadline TEXT,
    updated_deadline TEXT,
    previous_status TEXT,
    new_status TEXT,
    detected_at TEXT NOT NULL,
    alert_sent BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY (notice_id) REFERENCES notices(notice_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notices_source ON notices(source_id);
CREATE INDEX IF NOT EXISTS idx_notices_due_at ON notices(due_at);
CREATE INDEX IF NOT EXISTS idx_notices_status ON notices(notice_status);
CREATE INDEX IF NOT EXISTS idx_change_history_notice ON change_history(notice_id);
