
"""SQLite database setup for ArogyaAI.

Uses Python's built-in sqlite3 module — no extra dependency, no native
build step, and a single file database that is trivial to demo/judge.
"""

import os
import sqlite3


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DB_PATH = os.environ.get(
    "DB_PATH",
    os.path.join(DATA_DIR, "arogya.db")
)


# ============================================================
# DATABASE SCHEMA
# ============================================================

SCHEMA = """
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    abha_number TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    email TEXT,
    date_of_birth TEXT,
    gender TEXT,
    medical_history TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    profile_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    qualifications TEXT,
    workplace TEXT,
    workplace_address TEXT,
    profile_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    patient_id INTEGER NOT NULL
        REFERENCES patients(id)
        ON DELETE CASCADE,

    symptoms TEXT NOT NULL,

    duration TEXT NOT NULL,

    -- NEW FIELD:
    -- Exact location of the patient's problem
    -- Example: "left knee", "lower abdomen", etc.
    problem_location TEXT,

    -- NEW FIELD:
    -- Whether the same issue occurred before
    -- Expected values: "yes" or "no"
    occurred_before TEXT,

    urgency_level TEXT NOT NULL,

    urgency_score INTEGER NOT NULL,

    tags TEXT NOT NULL DEFAULT '[]',

    report_filename TEXT,

    report_original_name TEXT,

    status TEXT NOT NULL DEFAULT 'pending',

    doctor_id INTEGER
        REFERENCES doctors(id)
        ON DELETE SET NULL,

    doctor_notes TEXT,

    diagnosis TEXT,

    reviewed_at TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


CREATE INDEX IF NOT EXISTS idx_records_patient
ON medical_records(patient_id);

CREATE INDEX IF NOT EXISTS idx_records_status
ON medical_records(status);

CREATE INDEX IF NOT EXISTS idx_records_urgency
ON medical_records(urgency_score);
"""


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db():
    """Open a new SQLite database connection.

    A short-lived connection per request is the simplest, safest pattern
    for SQLite in a small Flask app (no cross-thread connection sharing to
    worry about).
    """

    conn = sqlite3.connect(DB_PATH)

    conn.row_factory = sqlite3.Row

    conn.execute(
        "PRAGMA foreign_keys = ON"
    )

    return conn


# ============================================================
# CHECK COLUMN
# ============================================================

def column_exists(conn, table_name, column_name):
    """Check whether a column already exists in a table."""

    columns = conn.execute(
        f"PRAGMA table_info({table_name})"
    ).fetchall()

    return any(
        column["name"] == column_name
        for column in columns
    )


# ============================================================
# DATABASE MIGRATION
# ============================================================

def migrate_database(conn):
    """Add new columns to an existing database.

    This is important because CREATE TABLE IF NOT EXISTS does not
    modify an existing table.

    Existing patient records and medical records are preserved.
    """

    # --------------------------------------------------------
    # Add problem_location if it does not already exist
    # --------------------------------------------------------

    if not column_exists(
        conn,
        "medical_records",
        "problem_location"
    ):
        conn.execute(
            """
            ALTER TABLE medical_records
            ADD COLUMN problem_location TEXT
            """
        )

    # --------------------------------------------------------
    # Add occurred_before if it does not already exist
    # --------------------------------------------------------

    if not column_exists(
        conn,
        "medical_records",
        "occurred_before"
    ):
        conn.execute(
            """
            ALTER TABLE medical_records
            ADD COLUMN occurred_before TEXT
            """
        )


# ============================================================
# INITIALIZE DATABASE
# ============================================================

def init_db():
    conn = get_db()

    try:
        # Create tables and indexes
        conn.executescript(SCHEMA)

        # Update existing databases with new columns
        migrate_database(conn)

        # Save all changes
        conn.commit()

    except Exception:
        # If anything goes wrong, undo incomplete changes
        conn.rollback()

        # Re-raise the original error so the real problem
        # is visible during development
        raise

    finally:
        # Always close the database connection
        conn.close()

