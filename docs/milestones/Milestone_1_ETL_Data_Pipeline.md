# Milestone 1: Automated ETL Pipeline & Relational Data Store

**Project**: RetailPulse – AI-Powered Customer Analytics & Demand Forecasting Platform  
**Milestone**: 1 of 5 (Data Pipeline & ETL Engineering)  
**Status**: Completed (Submission Ready)

---

## 1. Executive Summary
Milestone 1 establishes the end-to-end data foundation for RetailPulse. It ingests large-scale retail transactional, customer, product catalog, and warehouse inventory records. The automated ETL pipeline extracts raw sources, executes data transformation and anomaly cleaning, standardizes relational schemas, and stores optimized indexed tables in an analytical SQLite database (`retailpulse.db`).

---

## 2. Dataset Architecture & Data Dictionary

The simulated enterprise retail database contains **99,800+ transactions across 3 years (2023–2026)**, representing seasonal sales trends, customer purchasing profiles, and multi-category product lines.

### 2.1 Relational Schema Architecture

```
   ┌───────────────────────┐             ┌────────────────────────┐
   │       CUSTOMERS       │             │        PRODUCTS        │
   ├───────────────────────┤             ├────────────────────────┤
   │ CustomerID (PK)       │             │ ProductID (PK)         │
   │ CustomerName          │             │ ProductName            │
   │ Segment               │             │ Category               │
   │ Region                │             │ SubCategory            │
   │ Profile               │             │ UnitPrice              │
   └──────────┬────────────┘             │ UnitCost               │
              │                          └───────────┬────────────┘
              │ 1:N                                  │ 1:N
              │          ┌────────────────┐          │
              └─────────►│     SALES      │◄─────────┘
                         ├────────────────┤
                         │ OrderID        │
                         │ OrderDate      │
                         │ CustomerID(FK) │
                         │ ProductID(FK)  │
                         │ Sales          │
                         │ Quantity       │
                         │ Discount       │
                         │ Profit         │
                         └────────────────┘
                                  ▲
                                  │ 1:1
                         ┌────────┴───────┐
                         │   INVENTORY    │
                         ├────────────────┤
                         │ ProductID (PK) │
                         │ CurrentStock   │
                         │ MinStockLevel  │
                         │ ReorderPoint   │
                         │ LeadTime       │
                         └────────────────┘
```

### 2.2 Data Dictionary

| Table | Column | Type | Description |
|---|---|---|---|
| **sales** | `OrderID` | TEXT | Unique transaction identifier |
| **sales** | `OrderDate` | TEXT (YYYY-MM-DD) | Date when order was placed |
| **sales** | `CustomerID` | TEXT | Foreign key referring to `customers` |
| **sales** | `ProductID` | TEXT | Foreign key referring to `products` |
| **sales** | `Sales` | REAL | Total transaction sales value ($) |
| **sales** | `Quantity` | INTEGER | Units purchased in order |
| **sales** | `Discount` | REAL | Promotional discount percentage |
| **sales** | `Profit` | REAL | Net profit generated from order |
| **customers** | `CustomerID` | TEXT (PK) | Unique customer ID (e.g. CUST-10045) |
| **customers** | `CustomerName` | TEXT | Full customer name |
| **customers** | `Region` | TEXT | Geographical store market |
| **products** | `ProductID` | TEXT (PK) | Unique SKU code |
| **products** | `ProductName` | TEXT | Item description |
| **products** | `Category` | TEXT | Retail department |
| **products** | `UnitPrice` | REAL | Retail selling price ($) |
| **products** | `UnitCost` | REAL | Acquisition cost ($) |
| **inventory** | `ProductID` | TEXT (PK) | Unique SKU matching products table |
| **inventory** | `CurrentStock` | INTEGER | Physical units currently on warehouse shelves |
| **inventory** | `LeadTime` | INTEGER | Supplier fulfillment transit time (days) |

---

## 3. Automated ETL Pipeline Implementation (`src/etl.py`)

1. **Extraction**: Reads raw transaction logs, customer profiles, product catalogs, and inventory feeds from `data/`.
2. **Transformation & Cleaning**:
   - Parses dates into ISO-8601 standardized formats (`YYYY-MM-DD`).
   - Removes duplicate records on primary keys.
   - Handles missing customer identities with default fallbacks.
   - Filters anomalous negative values on pricing and quantity.
   - Exports clean datasets to `data/processed/`.
3. **Database Loading & Optimization**:
   - Replaces or updates SQLite tables with appropriate types.
   - Generates B-tree indexes for accelerated query execution:
     - `idx_sales_date` on `sales(OrderDate)`
     - `idx_sales_cust` on `sales(CustomerID)`
     - `idx_sales_prod` on `sales(ProductID)`
     - `idx_cust_segment` on `customers(Segment)`
   - Populates metadata audit table `etl_metadata`.

---

## 4. Execution & Verification Logs

```text
--- STEP 1: DATA GENERATION ---
Data generation complete! Saved files to E:\Zidio Internship\RetailPulse\data
Generated 99,832 transactions, 1,000 customers, 200 products.

--- STEP 2: ETL INGESTION ---
Starting ETL pipeline...
Extracted row counts - Sales: 99,832, Customers: 1,000, Products: 200, Inventory: 200
ETL Pipeline complete! Loaded clean tables with indexes into database: retailpulse.db
Database Tables Verified: sales, customers, products, inventory, etl_metadata
```

---

## 5. Milestone Deliverables Checklist
- [x] Synthetic retail transaction generator with seasonality and trends (`src/data_generator.py`)
- [x] Automated ETL extraction, transformation, cleaning, and SQLite loader (`src/etl.py`)
- [x] Relational schema design with foreign keys and performance indexes
- [x] Clean CSV files stored in `data/processed/`
- [x] Automated unit test validation (`tests/test_etl.py` passing 100%)
