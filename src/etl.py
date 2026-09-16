import os
import sqlite3
import pandas as pd

def run_etl_pipeline(data_dir="e:/Zidio Internship/RetailPulse/data", db_path="e:/Zidio Internship/RetailPulse/retailpulse.db"):
    """
    Cleans raw retail datasets and loads them into a local SQLite database for analytics.
    """
    print("Starting ETL pipeline...")
    
    # 1. Paths to raw files
    sales_path = os.path.join(data_dir, "sales_raw.csv")
    customers_path = os.path.join(data_dir, "customers_raw.csv")
    products_path = os.path.join(data_dir, "products_raw.csv")
    inventory_path = os.path.join(data_dir, "inventory_raw.csv")
    
    # Check if files exist
    for path in [sales_path, customers_path, products_path, inventory_path]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Raw data file not found: {path}. Please run data_generator.py first.")

    # 2. Extract Data
    df_sales = pd.read_csv(sales_path)
    df_customers = pd.read_csv(customers_path)
    df_products = pd.read_csv(products_path)
    df_inventory = pd.read_csv(inventory_path)
    
    print(f"Extracted row counts - Sales: {len(df_sales)}, Customers: {len(df_customers)}, Products: {len(df_products)}, Inventory: {len(df_inventory)}")

    # 3. Transform Data
    # Sales data transformation
    df_sales["OrderDate"] = pd.to_datetime(df_sales["OrderDate"])
    # Drop duplicates if any
    df_sales = df_sales.drop_duplicates()
    # Check for nulls and fill/drop
    df_sales = df_sales.dropna(subset=["OrderID", "CustomerID", "ProductID"])
    
    # Customers data transformation
    df_customers = df_customers.drop_duplicates(subset=["CustomerID"])
    df_customers["CustomerName"] = df_customers["CustomerName"].fillna("Unknown Customer")
    
    # Products data transformation
    df_products = df_products.drop_duplicates(subset=["ProductID"])
    df_products["UnitPrice"] = df_products["UnitPrice"].astype(float)
    df_products["UnitCost"] = df_products["UnitCost"].astype(float)
    
    # Inventory data transformation
    df_inventory = df_inventory.drop_duplicates(subset=["ProductID"])
    
    # Create output directories for processed data
    processed_dir = os.path.join(data_dir, "processed")
    os.makedirs(processed_dir, exist_ok=True)
    
    # Save clean versions as processed CSVs
    df_sales.to_csv(os.path.join(processed_dir, "sales_clean.csv"), index=False)
    df_customers.to_csv(os.path.join(processed_dir, "customers_clean.csv"), index=False)
    df_products.to_csv(os.path.join(processed_dir, "products_clean.csv"), index=False)
    df_inventory.to_csv(os.path.join(processed_dir, "inventory_clean.csv"), index=False)

    # 4. Load into SQLite Database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Drop existing tables to ensure freshness
    cursor.execute("DROP TABLE IF EXISTS sales")
    cursor.execute("DROP TABLE IF EXISTS customers")
    cursor.execute("DROP TABLE IF EXISTS products")
    cursor.execute("DROP TABLE IF EXISTS inventory")
    
    # Create tables with correct schema
    cursor.execute("""
        CREATE TABLE products (
            ProductID TEXT PRIMARY KEY,
            ProductName TEXT,
            Category TEXT,
            SubCategory TEXT,
            UnitPrice REAL,
            UnitCost REAL
        )
    """)
    
    cursor.execute("""
        CREATE TABLE customers (
            CustomerID TEXT PRIMARY KEY,
            CustomerName TEXT,
            Segment TEXT,
            Region TEXT,
            Profile TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE sales (
            OrderID TEXT,
            OrderDate TEXT,
            CustomerID TEXT,
            ProductID TEXT,
            Sales REAL,
            Quantity INTEGER,
            Discount REAL,
            Profit REAL,
            FOREIGN KEY (CustomerID) REFERENCES customers(CustomerID),
            FOREIGN KEY (ProductID) REFERENCES products(ProductID)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE inventory (
            ProductID TEXT PRIMARY KEY,
            CurrentStock INTEGER,
            MinStockLevel INTEGER,
            ReorderPoint INTEGER,
            LeadTime INTEGER,
            FOREIGN KEY (ProductID) REFERENCES products(ProductID)
        )
    """)
    
    # Insert DataFrames into tables
    # Convert dates to string format for storage
    df_sales_db = df_sales.copy()
    df_sales_db["OrderDate"] = df_sales_db["OrderDate"].dt.strftime("%Y-%m-%d")
    
    df_products.to_sql("products", conn, if_exists="append", index=False)
    df_customers.to_sql("customers", conn, if_exists="append", index=False)
    df_sales_db.to_sql("sales", conn, if_exists="append", index=False)
    df_inventory.to_sql("inventory", conn, if_exists="append", index=False)
    
    # Create indexes for high-speed analytical queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(OrderDate);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sales_cust ON sales(CustomerID);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sales_prod ON sales(ProductID);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cust_segment ON customers(Segment);")
    
    # Validation summary table
    cursor.execute("DROP TABLE IF EXISTS etl_metadata")
    cursor.execute("""
        CREATE TABLE etl_metadata (
            Metric TEXT,
            Value TEXT,
            Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    metadata = [
        ("Total Sales Records", str(len(df_sales_db))),
        ("Total Customers", str(len(df_customers))),
        ("Total Products", str(len(df_products))),
        ("Total Inventory Items", str(len(df_inventory))),
        ("Date Range Start", str(df_sales_db["OrderDate"].min())),
        ("Date Range End", str(df_sales_db["OrderDate"].max())),
        ("Total Sales Volume ($)", f"{df_sales_db['Sales'].sum():.2f}")
    ]
    cursor.executemany("INSERT INTO etl_metadata (Metric, Value) VALUES (?, ?)", metadata)

    conn.commit()
    conn.close()
    
    print(f"ETL Pipeline complete! Loaded clean tables with indexes into database: {db_path}")

if __name__ == "__main__":
    run_etl_pipeline()
