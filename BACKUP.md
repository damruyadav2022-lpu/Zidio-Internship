# RetailPulse Disaster Recovery & Automated Backup Runbook

RetailPulse features an enterprise-grade, zero-downtime backup and disaster recovery architecture designed to protect commercial customer and transactional data.

---

## 1. Disaster Recovery Objectives

| Metric | Target | Description |
|---|---|---|
| **RPO** (Recovery Point Objective) | **< 1 Hour** | Maximum acceptable data loss window during catastrophic hardware or datacenter failure. |
| **RTO** (Recovery Time Objective) | **< 5 Minutes** | Maximum time required to restore the full platform database to a verified healthy state. |
| **Backup Integrity** | **100% SHA-256 Verified** | Every archive includes a cryptographic sidecar checksum verified prior to extraction. |
| **Rollback Safety** | **Zero-Risk Inversion** | Live target databases are preserved in an atomic `.pre_restore_bak` snapshot before overwriting. |

---

## 2. Backup Architecture

```
┌─────────────────────────────────┐
│     Live Operational Database   │
│       (PostgreSQL / SQLite)     │
└────────────────┬────────────────┘
                 │
                 │ 1. Atomic Hot Snapshot (sqlite3.backup / pg_dump)
                 ▼
┌─────────────────────────────────┐
│   Raw Database Snapshot File    │
└────────────────┬────────────────┘
                 │
                 │ 2. Maximum Gzip Compression (Level 9)
                 ▼
┌─────────────────────────────────┐
│ retailpulse_backup_<date>.db.gz │
└────────────────┬────────────────┘
                 │
                 │ 3. Compute SHA-256 Digest
                 ▼
┌─────────────────────────────────┐
│ .sha256 Sidecar Hash File       │
└────────────────┬────────────────┘
                 │
                 │ 4. Audit Log Entry & 30-Day Retention Prune
                 ▼
┌─────────────────────────────────┐
│ Compliance Audit Log Recorded   │
└─────────────────────────────────┘
```

---

## 3. Backup Execution

### Running an Automated Hot Backup
To create a timestamped, compressed, and checksummed backup:

```bash
python scripts/backup_database.py
```

Output:
```
==================================================
 RetailPulse Enterprise Automated Backup Service
==================================================
Engine:    SQLite (Local High-Performance WAL Engine)
Timestamp: 2026-09-16T19:50:50.418248+00:00
[Success] Backup completed successfully!
Archive:   /app/backups/retailpulse_backup_20260916_195050.db.gz
Size:      3003.36 KB
SHA-256:   c56d431c8d9cf34486a2ffb39640761801b8f959117d958fab5c5a6a5a8c571e
```

### Command Options
- `--retention-days <N>`: Sets the number of days to retain backup files (default: 30 days). Older files are safely pruned.
- `--output-dir <path>`: Specifies custom destination directory (default: `backups/`).

---

## 4. Disaster Recovery Restoration

### Step 1: Pre-Flight Integrity Verification (`--dry-run`)
Before modifying any live database, always validate archive decompression, SHA-256 checksum, and SQLite table health:

```bash
python scripts/restore_database.py --dry-run
```

Output:
```
[Info] Using latest backup archive: backups/retailpulse_backup_20260916_195050.db.gz
==================================================
 RetailPulse Database Disaster Recovery Restore
==================================================
Archive:    backups/retailpulse_backup_20260916_195050.db.gz
Target DB:  retailpulse.db
Dry Run:    YES (Validation Only)
[Verified] SHA-256 checksum matches: c56d431c8d9cf34486a2ffb39640761801b8f959117d958fab5c5a6a5a8c571e
[Extracting] Decompressing archive to temporary workspace...
[Verifying] Running SQLite integrity verification...
[Verified] Found 32 tables: users, organizations, stores, sales, customers...
[Dry Run Complete] Backup archive is 100% valid and ready for live restoration.
```

### Step 2: Live Disaster Recovery Restoration
To restore the live production database:

```bash
python scripts/restore_database.py
```

Or restore a specific historical archive:
```bash
python scripts/restore_database.py --backup-file backups/retailpulse_backup_20260916_195050.db.gz
```

---

## 5. Production Scheduling & Cloud Synchronization

### Linux Crontab Automation
Add the following entry to `/etc/cron.d/retailpulse_backup` for automated daily backups at 02:00 UTC:

```cron
# RetailPulse Automated Daily Disaster Recovery Backup
0 2 * * * cd /app && /usr/local/bin/python scripts/backup_database.py --retention-days 30 >> /var/log/retailpulse_backup.log 2>&1
```

### Offsite S3 Cloud Mirroring
To comply with multi-region disaster recovery, synchronize backups to Amazon S3:

```bash
aws s3 sync /app/backups/ s3://retailpulse-production-backups/database/ \
    --exclude "*" \
    --include "retailpulse_backup_*.gz" \
    --include "retailpulse_backup_*.sha256"
```

---

## 6. Disaster Recovery Drill Checklist

Perform quarterly disaster recovery drills using this checklist:
- [ ] Verify scheduled backup executed within the last 24 hours.
- [ ] Inspect SHA-256 sidecar file matches the `.gz` archive.
- [ ] Execute `python scripts/restore_database.py --dry-run` on a staging server.
- [ ] Verify that 32 master tables and row counts match production benchmarks.
- [ ] Check `audit_logs` table for `database.backup.created` and `database.restore.completed`.
