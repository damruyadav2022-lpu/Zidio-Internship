import os
import tempfile
import sqlite3
from scripts.backup_database import backup_sqlite, calculate_sha256
from scripts.restore_database import restore_database, verify_checksum, verify_sqlite_integrity

def test_backup_and_restore_cycle():
    """Validates the end-to-end backup generation, checksumming, and non-destructive restoration cycle."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Create a sample database in tmp_dir
        sample_db = os.path.join(tmp_dir, "test_sample.db")
        conn = sqlite3.connect(sample_db)
        conn.execute("CREATE TABLE test_items (id INTEGER PRIMARY KEY, name TEXT);")
        conn.execute("INSERT INTO test_items (name) VALUES ('Widget A'), ('Widget B');")
        conn.commit()
        conn.close()

        # Monkeypatch DB_PATH temporarily for backup
        from scripts import backup_database
        orig_db_path = backup_database.DB_PATH
        backup_database.DB_PATH = sample_db

        try:
            # Step 1: Run backup
            backup_file, checksum = backup_sqlite(tmp_dir)
            assert os.path.exists(backup_file)
            assert backup_file.endswith(".db.gz")
            assert len(checksum) == 64

            # Verify sha256 sidecar file
            sha_file = backup_file + ".sha256"
            assert os.path.exists(sha_file)
            assert verify_checksum(backup_file) is True

            # Step 2: Test dry-run restore
            dry_run_success = restore_database(backup_file, target_path=sample_db, dry_run=True)
            assert dry_run_success is True

            # Step 3: Test live restore to a new target destination
            restored_target = os.path.join(tmp_dir, "restored_output.db")
            restore_success = restore_database(backup_file, target_path=restored_target, dry_run=False)
            assert restore_success is True
            assert os.path.exists(restored_target)

            # Step 4: Verify restored database integrity and records
            conn_res = sqlite3.connect(restored_target)
            cursor = conn_res.cursor()
            cursor.execute("SELECT name FROM test_items ORDER BY id;")
            names = [row[0] for row in cursor.fetchall()]
            conn_res.close()
            assert names == ['Widget A', 'Widget B']
        finally:
            backup_database.DB_PATH = orig_db_path
