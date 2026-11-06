"""Pencatat Jejak Audit Transaksi Penimbangan (C9).

Menyimpan log append-only ke format JSONL dan mengindeks ke SQLite lokal.
Mengacu pada spesifikasi arsitektur Bab III (C9).
"""

import json
import os
import sqlite3
from typing import Dict, List, Optional
from ..pipeline.schema import DecisionContract


class AuditLogger:
    """Mengelola persistensi jejak audit luring untuk setiap keputusan sistem."""

    def __init__(self, audit_dir: str = "sistem/data/audit"):
        self.audit_dir = audit_dir
        os.makedirs(audit_dir, exist_ok=True)
        self.jsonl_path = os.path.join(audit_dir, "audit.jsonl")
        self.db_path = os.path.join(audit_dir, "audit.db")
        self._init_sqlite()

    def _init_sqlite(self) -> None:
        """Inisialisasi tabel SQLite jika belum ada."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    reading TEXT,
                    decision TEXT,
                    trigger_layer TEXT,
                    reason TEXT,
                    calibrated_score REAL,
                    threshold_applied REAL,
                    product_id TEXT,
                    device_id TEXT,
                    raw_data TEXT
                )
                """
            )
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_decision ON transactions(decision)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON transactions(timestamp)")
            conn.commit()

    def log_decision(self, decision: DecisionContract) -> int:
        """Mencatat satu keputusan transaksi ke JSONL dan SQLite."""
        record = decision.model_dump()
        record_json = json.dumps(record, ensure_ascii=False)

        # 1. Append ke JSONL
        with open(self.jsonl_path, "a", encoding="utf-8") as f:
            f.write(record_json + "\n")

        # 2. Insert ke SQLite
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO transactions (
                    timestamp, reading, decision, trigger_layer, reason,
                    calibrated_score, threshold_applied, product_id, device_id, raw_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    decision.timestamp,
                    decision.reading,
                    decision.decision.value,
                    decision.trigger_layer,
                    decision.reason,
                    decision.calibrated_score,
                    decision.threshold_applied,
                    decision.product_id,
                    decision.device_id,
                    record_json,
                ),
            )
            conn.commit()
            return cursor.lastrowid

    def get_transactions(
        self,
        limit: int = 50,
        offset: int = 0,
        decision_filter: Optional[str] = None,
    ) -> List[Dict]:
        """Mengambil daftar transaksi audit untuk penyajian antarmuka."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if decision_filter:
                cursor.execute(
                    """
                    SELECT id, timestamp, reading, decision, trigger_layer, reason,
                           calibrated_score, threshold_applied, product_id, device_id
                    FROM transactions
                    WHERE decision = ?
                    ORDER BY id DESC LIMIT ? OFFSET ?
                    """,
                    (decision_filter, limit, offset),
                )
            else:
                cursor.execute(
                    """
                    SELECT id, timestamp, reading, decision, trigger_layer, reason,
                           calibrated_score, threshold_applied, product_id, device_id
                    FROM transactions
                    ORDER BY id DESC LIMIT ? OFFSET ?
                    """,
                    (limit, offset),
                )
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def get_summary_counts(self) -> Dict[str, int]:
        """Mengambil ringkasan jumlah transaksi per keadaan keputusan."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT decision, COUNT(*) FROM transactions GROUP BY decision")
            counts = dict(cursor.fetchall())
            return {
                "total": sum(counts.values()),
                "terima": counts.get("TERIMA", 0),
                "tolak": counts.get("TOLAK", 0),
                "konfirmasi": counts.get("KONFIRMASI", 0),
                "batal": counts.get("BATAL", 0),
            }
