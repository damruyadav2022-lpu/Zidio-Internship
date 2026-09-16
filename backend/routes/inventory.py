from fastapi import APIRouter, HTTPException, Query, Body, Depends
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from backend.database import query_df
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

# Service level mapping
Z_SCORES = {
    90: 1.282,
    95: 1.645,
    99: 2.326
}

@router.get("")
def get_inventory_recommendations(
    category: str = Query("All", description="Filter category"),
    status: str = Query("All", description="Filter status: Critical, Warning, Healthy"),
    search: str = Query("", description="Search by SKU or Product name"),
    service_level: int = Query(95, description="90, 95, or 99%"),
    user: dict = Depends(get_current_user)
):
    try:
        df_inv = query_df("SELECT * FROM inventory_recommendations")
        df_prods = query_df("SELECT ProductID, UnitPrice as Price FROM products")

        df = df_inv.merge(df_prods, on="ProductID", how="left")
        df["Price"] = df["Price"].fillna(50.0)

        # Dynamic recalculation if user changes service level
        z = Z_SCORES.get(service_level, 1.645)
        
        # Lead time standard dev approximation
        lead_time = 7.0
        # Mathematically clean scaling of Safety Stock and Reorder Point
        base_ss = df["SafetyStock"].copy()
        lead_time_demand = (df["ReorderPoint"] - base_ss).clip(lower=0)
        scaled_ss = (base_ss * (z / 1.645)).round().astype(int)
        df["SafetyStock"] = scaled_ss
        df["ReorderPoint"] = (lead_time_demand + scaled_ss).round().astype(int)
        
        # Calculate Days of Coverage: CurrentStock / max(1, DailyDemand)
        # Approximate daily demand: (ReorderPoint - SafetyStock) / lead_time
        df["DailyDemand"] = ((df["ReorderPoint"] - df["SafetyStock"]).clip(lower=1) / lead_time).round(1)
        df["CoverageDays"] = (df["CurrentStock"] / df["DailyDemand"].clip(lower=0.5)).round(1)

        # Re-evaluate Alert Status dynamically
        def evaluate_status(row):
            if row["CurrentStock"] < row["SafetyStock"]:
                return "Critical (Red)"
            elif row["CurrentStock"] < row["ReorderPoint"]:
                return "Warning (Yellow)"
            return "Healthy (Green)"

        df["AlertLevel"] = df.apply(evaluate_status, axis=1)

        # Suggested order recalculation
        def calc_order(row):
            if row["CurrentStock"] < row["ReorderPoint"]:
                return max(0, int(row["ReorderPoint"] * 1.5 - row["CurrentStock"]))
            return 0

        df["SuggestedOrder"] = df.apply(calc_order, axis=1)
        df["TotalOrderValue"] = (df["SuggestedOrder"] * df["Price"]).round(2)

        # Filtering
        if category and category != "All":
            df = df[df["Category"] == category]

        if status and status != "All":
            df = df[df["AlertLevel"].str.contains(status, case=False, na=False)]

        if search:
            s_lower = search.lower().strip()
            df = df[
                df["ProductID"].str.lower().str.contains(s_lower, na=False) |
                df["ProductName"].str.lower().str.contains(s_lower, na=False)
            ]

        # Summary KPIs
        critical_count = int((df["AlertLevel"].str.contains("Critical|Red", case=False)).sum())
        warning_count = int((df["AlertLevel"].str.contains("Warning|Yellow", case=False)).sum())
        healthy_count = int((df["AlertLevel"].str.contains("Healthy|Green", case=False)).sum())
        total_reorder_qty = int(df["SuggestedOrder"].sum())
        total_capital = float(df["TotalOrderValue"].sum())

        return {
            "summary": {
                "total_skus": len(df),
                "critical_red": critical_count,
                "reorder_yellow": warning_count,
                "healthy_green": healthy_count,
                "total_reorder_qty": total_reorder_qty,
                "total_reorder_capital": round(total_capital, 2),
                "service_level": service_level,
                "z_score": z
            },
            "items": df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate inventory recommendations: {str(e)}")

@router.post("/purchase-order")
def create_purchase_order(payload: dict = Body(...)):
    try:
        items = payload.get("items", [])
        supplier = payload.get("supplier", "Global Retail Logistics Ltd.")
        delivery_days = payload.get("delivery_days", 7)

        if not items:
            raise HTTPException(status_code=400, detail="No items selected for purchase order.")

        po_number = f"PO-2026-{random.randint(10000, 99999)}"
        created_at = datetime.utcnow()
        delivery_date = created_at + timedelta(days=delivery_days)

        total_units = 0
        total_amount = 0.0
        po_lines = []

        for item in items:
            qty = int(item.get("quantity", 0))
            price = float(item.get("unit_price", 45.0))
            subtotal = round(qty * price, 2)
            total_units += qty
            total_amount += subtotal

            po_lines.append({
                "ProductID": item.get("product_id"),
                "ProductName": item.get("product_name", item.get("product_id")),
                "Category": item.get("category", "General"),
                "Quantity": qty,
                "UnitPrice": price,
                "Subtotal": subtotal
            })

        return {
            "status": "success",
            "po_number": po_number,
            "created_date": created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "expected_delivery": delivery_date.strftime("%Y-%m-%d"),
            "supplier": supplier,
            "total_items": len(po_lines),
            "total_units": total_units,
            "total_amount": round(total_amount, 2),
            "lines": po_lines
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate purchase order: {str(e)}")
