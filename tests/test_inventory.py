import os
import sqlite3
import pytest
import pandas as pd

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "retailpulse.db")

def test_inventory_recommendations_logic():
    conn = sqlite3.connect(DB_PATH)
    df_inv = pd.read_sql_query("SELECT * FROM inventory_recommendations", conn)
    conn.close()
    
    assert len(df_inv) > 0, "Inventory recommendations table is empty"
    
    # Check that Reorder Point is strictly greater than or equal to Safety Stock
    assert (df_inv["ReorderPoint"] >= df_inv["SafetyStock"]).all(), "Reorder Point is less than Safety Stock"
    
    # Check that CurrentStock and SafetyStock are non-negative
    assert (df_inv["CurrentStock"] >= 0).all(), "Negative stock found"
    assert (df_inv["SafetyStock"] > 0).all(), "Safety stock must be greater than zero"
    
    # Check alert consistency
    critical_items = df_inv[df_inv["CurrentStock"] <= df_inv["SafetyStock"]]
    assert (critical_items["AlertLevel"] == "Red (Critical)").all(), "Critical stock alert mismatch"

def test_data_drift_monitoring_results():
    conn = sqlite3.connect(DB_PATH)
    df_drift = pd.read_sql_query("SELECT * FROM data_drift_monitoring", conn)
    conn.close()
    
    assert len(df_drift) >= 3, "Expected at least 3 features monitored for drift"
    assert "KS_Statistic" in df_drift.columns
    assert "P_Value" in df_drift.columns
    assert "Status" in df_drift.columns
    assert (df_drift["P_Value"] >= 0.0).all() and (df_drift["P_Value"] <= 1.0).all()
