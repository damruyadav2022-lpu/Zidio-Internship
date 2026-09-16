#!/usr/bin/env python3
"""
RetailPulse Enterprise Database Restore Utility
Provides safe, transactional restoration of RetailPulse database archives with
checksum verification, SQLite integrity validation, and automated pre-restore rollbacks.
"""

import os
import sys
import gzip
import shutil
import hashlib
import sqlite3
import argparse
from datetime import datetime, timezone

# Ensure project root is in sys.path
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from backend.database import DB_PATH, log_audit_event

def calculate_sha256(file_path: str) -> str:
    """Calculates the SHA-256 checksum of a file."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def verify_checksum(backup_file: str) -> bool:
    """Checks if a matching .sha256 file exists and verifies the archive against it."""
    checksum_file = backup_file + ".sha256"
    if not os.path.exists(checksum_file):
        print("[Notice] No .sha256 checksum file found alongside archive. Skipping checksum check.")
        return True

    with open(checksum_file, "r") as f:
        line = f.readline().strip()
        expected_hash = line.split()[0]

    actual_hash = calculate_sha256(backup_file)
    if actual_hash.lower() == expected_hash.lower():
        print(f"[Verified] SHA-256 checksum matches: {actual_hash}")
        return True
    else:
        print(f"[Integrity Failure] Checksum mismatch! Expected {expected_hash}, got {actual_hash}", file=sys.stderr)
        return False

def verify_sqlite_integrity(db_path: str) -> bool:
    """Executes PRAGMA integrity_check on the decompressed SQLite database."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA integrity_check;")
        row = cursor.fetchone()
        conn.close()
        if row and row[0] == "ok":
            return True
        print(f"[Integrity Warning] PRAGMA integrity_check returned: {row}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"[Integrity Error] Could not verify database integrity: {e}", file=sys.stderr)
        return False

def restore_database(backup_file: str, target_path: str = DB_PATH, dry_run: bool = False) -> bool:
    if not os.path.exists(backup_file):
        raise FileNotFoundError(f"Backup archive not found at {backup_file}")

    print(f"==================================================")
    print(f" RetailPulse Database Disaster Recovery Restore")
    print(f"==================================================")
    print(f"Archive:    {backup_file}")
    print(f"Target DB:  {target_path}")
    print(f"Dry Run:    {'YES (Validation Only)' if dry_run else 'NO (Live Restore)'}")
    print(f"Timestamp:  {datetime.now(timezone.utc).isoformat()}")

    # Step 1: Checksum verification
    if not verify_checksum(backup_file):
        raise ValueError("Archive integrity check failed. Restore aborted.")

    # Step 2: Extract to temporary verification file
    temp_restored_db = target_path + ".temp_verify"
    print("[Extracting] Decompressing archive to temporary workspace...")
    with gzip.open(backup_file, "rb") as f_in:
        with open(temp_restored_db, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)

    # Step 3: SQLite internal integrity check
    print("[Verifying] Running SQLite integrity verification...")
    if not verify_sqlite_integrity(temp_restored_db):
        os.remove(temp_restored_db)
        raise ValueError("Database PRAGMA integrity check failed. Archive may be corrupt.")

    # Count sample tables to ensure valid schema
    conn = sqlite3.connect(temp_restored_db)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    print(f"[Verified] Found {len(tables)} tables: {', '.join(tables[:6])}...")

    if dry_run:
        os.remove(temp_restored_db)
        print("[Dry Run Complete] Backup archive is 100% valid and ready for live restoration.")
        return True

    # Step 4: Create pre-restore rollback backup of current live database
    if os.path.exists(target_path):
        rollback_path = target_path + ".pre_restore_bak"
        print(f"[Safety] Creating pre-restore rollback snapshot at {rollback_path}...")
        shutil.copy2(target_path, rollback_path)

    # Step 5: Atomically swap in the verified database
    print(f"[Applying] Overwriting {target_path} with restored data...")
    shutil.move(temp_restored_db, target_path)

    # Log audit event
    log_audit_event(
        action="database.restore.completed",
        resource="DatabaseService",
        details=f"Restored from archive {os.path.basename(backup_file)} with {len(tables)} tables."
    )
    print("[Success] Disaster recovery database restoration completed successfully!")
    return True

def main():
    parser = argparse.ArgumentParser(description="RetailPulse Enterprise Database Restore Utility")
    parser.add_argument("--backup-file", type=str, help="Path to .db.gz backup archive (defaults to latest in backups/)")
    parser.add_argument("--target-db", type=str, default=DB_PATH, help="Path to destination database")
    parser.add_argument("--dry-run", action="store_true", help="Validate archive without modifying the target database")
    args = parser.parse_args()

    backup_file = args.backup_file
    if not backup_file:
        backup_dir = os.path.join(PROJECT_DIR, "backups")
        if not os.path.exists(backup_dir):
            print("[Error] No backups directory found and no --backup-file specified.", file=sys.stderr)
            return 1
        archives = [f for f in os.listdir(backup_dir) if f.startswith("retailpulse_backup_") and f.endswith(".gz")]
        if not archives:
            print("[Error] No backup archives found in backups/ directory.", file=sys.stderr)
            return 1
        archives.sort(reverse=True)
        backup_file = os.path.join(backup_dir, archives[0])
        print(f"[Info] Using latest backup archive: {backup_file}")

    try:
        success = restore_database(backup_file, args.target_db, dry_run=args.dry_run)
        return 0 if success else 1
    except Exception as e:
        print(f"[Error] Restore failed: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
