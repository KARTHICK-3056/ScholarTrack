import sys
import os

# Add parent directory to path so database module can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import init_db

if __name__ == "__main__":
    print("[MIGRATIONS] Applying 001_init.sql raw migrations...")
    init_db()
    print("[MIGRATIONS] Database initialized successfully with PRAGMA foreign_keys = ON.")
