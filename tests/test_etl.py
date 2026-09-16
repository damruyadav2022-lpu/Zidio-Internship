import os
import sqlite3
import pytest
import pandas as pd

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "retailpulse.db")

def test_database_exists():
    assert os.path.exists(DB_PATH), f"Database file does not exist at {DB_PATH}"

def test_required_tables_exist():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    required = ["sales", "customers", "products", "inventory", "etl_metadata"]
    for table in required:
        assert table in tables, f"Missing required table: {table}"

def test_sales_data_integrity():
    conn = sqlite3.connect(DB_PATH)
    df_sales = pd.read_sql_query("SELECT * FROM sales LIMIT 500", conn)
    conn.close()
    
    assert len(df_sales) > 0, "Sales table is empty"
    assert "OrderID" in df_sales.columns
    assert "CustomerID" in df_sales.columns
    assert "ProductID" in df_sales.columns
    assert "Sales" in df_sales.columns
    assert (df_sales["Sales"] >= 0).all(), "Negative sales values detected"

def test_customers_unique_keys():
    conn = sqlite3.connect(DB_PATH)
    df_cust = pd.read_sql_query("SELECT CustomerID FROM customers", conn)
    conn.close()
    
    assert df_cust["CustomerID"].is_unique, "CustomerID has duplicates in customers table"
