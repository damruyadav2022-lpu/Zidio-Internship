import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_synthetic_data(output_dir="e:/Zidio Internship/RetailPulse/data", num_customers=1000, num_products=200):
    """
    Generates a realistic retail dataset containing transactions and inventory levels.
    """
    os.makedirs(output_dir, exist_ok=True)
    np.random.seed(42)
    random.seed(42)

    # 1. Generate Products
    categories = {
        "Furniture": ["Chairs", "Tables", "Bookcases", "Furnishings"],
        "Office Supplies": ["Paper", "Binders", "Art", "Appliances", "Fasteners"],
        "Technology": ["Phones", "Accessories", "Copiers", "Machines"]
    }

    products = []
    product_ids = []
    for i in range(num_products):
        cat = random.choice(list(categories.keys()))
        sub_cat = random.choice(categories[cat])
        prod_id = f"{cat[:3].upper()}-{sub_cat[:2].upper()}-1000{i:04d}"
        product_ids.append(prod_id)
        
        # Determine price based on subcategory
        base_price = {
            "Chairs": random.uniform(80, 400),
            "Tables": random.uniform(150, 800),
            "Bookcases": random.uniform(100, 500),
            "Furnishings": random.uniform(10, 100),
            "Paper": random.uniform(5, 30),
            "Binders": random.uniform(2, 50),
            "Art": random.uniform(3, 40),
            "Appliances": random.uniform(50, 300),
            "Fasteners": random.uniform(1, 15),
            "Phones": random.uniform(100, 1000),
            "Accessories": random.uniform(15, 150),
            "Copiers": random.uniform(400, 2000),
            "Machines": random.uniform(200, 1500)
        }[sub_cat]

        prod_name = f"Premium {sub_cat[:-1] if sub_cat.endswith('s') else sub_cat} Model {i:03d}"
        cost = base_price * random.uniform(0.5, 0.7)  # 30-50% markup
        products.append({
            "ProductID": prod_id,
            "ProductName": prod_name,
            "Category": cat,
            "SubCategory": sub_cat,
            "UnitPrice": round(base_price, 2),
            "UnitCost": round(cost, 2)
        })
    
    df_products = pd.DataFrame(products)

    # 2. Generate Customers
    regions = ["East", "West", "Central", "South"]
    segments = ["Consumer", "Corporate", "Home Office"]
    
    first_names = ["John", "Mary", "Robert", "Patricia", "Michael", "Jennifer", "William", "Elizabeth", "David", "Barbara", 
                   "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", 
                  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]

    customers = []
    customer_profiles = {}  # Store hidden behavior profiles for simulating realistic transaction frequencies
    for i in range(num_customers):
        cust_id = f"CUST-{i+10000}"
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        seg = random.choice(segments)
        reg = random.choice(regions)
        
        # Behavior Profile: VIP, Regular, Occasional, Churning
        profile_type = np.random.choice(["VIP", "Regular", "Occasional", "Churn-Cohort"], p=[0.10, 0.50, 0.20, 0.20])
        customer_profiles[cust_id] = profile_type

        customers.append({
            "CustomerID": cust_id,
            "CustomerName": name,
            "Segment": seg,
            "Region": reg,
            "Profile": profile_type
        })
    
    df_customers = pd.DataFrame(customers)

    # 3. Generate Transactions (Sales History)
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2026, 5, 31)
    total_days = (end_date - start_date).days

    transactions = []
    order_counter = 100000

    # Pre-calculate baseline customer profiles and weights for fast numpy sampling
    cust_ids = np.array([c["CustomerID"] for c in customers])
    cust_profiles_arr = np.array([customer_profiles[c_id] for c_id in cust_ids])
    base_weights = np.array([{
        "VIP": 0.40,
        "Regular": 0.12,
        "Occasional": 0.04,
        "Churn-Cohort": 0.15
    }[p] for p in cust_profiles_arr])

    # Let's generate dates day-by-day to simulate proper time-series seasonality
    for day in range(total_days):
        current_date = start_date + timedelta(days=day)
        
        # Calculate daily transaction volume based on seasonality:
        # - Weekly seasonality (higher sales on weekends)
        # - Annual seasonality (massive spike in Nov/Dec)
        # - General positive trend over the 3 years
        weekday_factor = 1.3 if current_date.weekday() in [5, 6] else 0.95
        month = current_date.month
        annual_factor = 1.6 if month in [11, 12] else (0.8 if month in [1, 2] else 1.0)
        trend_factor = 1.0 + (day / total_days) * 0.35  # 35% growth over time
        
        base_transactions = int(25 * weekday_factor * annual_factor * trend_factor)
        daily_tx_count = max(5, np.random.poisson(base_transactions))

        # Vectorized Churn Simulation:
        # If past July 2025, zero out the weights of churn cohort customers
        current_weights = base_weights.copy()
        if current_date > datetime(2025, 7, 1):
            current_weights[cust_profiles_arr == "Churn-Cohort"] = 0.0
            
        sum_weights = current_weights.sum()
        if sum_weights == 0:
            continue
        p_normalized = current_weights / sum_weights

        # Sample active customers for today's orders using numpy vectorized weights
        todays_buyers = np.random.choice(cust_ids, size=min(daily_tx_count, len(cust_ids)), replace=False, p=p_normalized)

        for cust_id in todays_buyers:
            order_counter += 1
            order_id = f"CA-{current_date.year}-{order_counter}"
            
            # Select random number of items in order
            p_type = customer_profiles[cust_id]
            num_items = random.randint(2, 5) if p_type == "VIP" else random.randint(1, 3)
            
            # Sample products
            order_products = random.sample(products, k=min(num_items, len(products)))
            
            for prod in order_products:
                qty = random.randint(1, 6) if p_type == "VIP" else random.randint(1, 3)
                discount = 0.0
                # Apply seasonal discount occasionally
                if random.random() < 0.15:
                    discount = random.choice([0.1, 0.15, 0.2])
                elif annual_factor > 1.3 and random.random() < 0.4:
                    discount = random.choice([0.1, 0.2, 0.3])
                
                sales = round(prod["UnitPrice"] * qty * (1 - discount), 2)
                cost_of_goods = round(prod["UnitCost"] * qty, 2)
                profit = round(sales - cost_of_goods, 2)
                
                transactions.append({
                    "OrderID": order_id,
                    "OrderDate": current_date.strftime("%Y-%m-%d"),
                    "CustomerID": cust_id,
                    "ProductID": prod["ProductID"],
                    "Sales": sales,
                    "Quantity": qty,
                    "Discount": discount,
                    "Profit": profit
                })

    df_sales = pd.DataFrame(transactions)

    # 4. Generate Inventory Levels
    # For inventory, we calculate the standard demand for each product, and simulate current stock levels
    # some products will be normal, some overstocked, and some running very low (reorder needed)
    inventory = []
    for prod in products:
        prod_id = prod["ProductID"]
        
        # Calculate approximate historical daily demand rate
        prod_sales = df_sales[df_sales["ProductID"] == prod_id]
        total_qty = prod_sales["Quantity"].sum() if len(prod_sales) > 0 else 10
        avg_daily_demand = total_qty / total_days
        
        # Set realistic Lead Time (in days)
        lead_time = random.choice([3, 5, 7, 10])
        
        # Safety stock calculation base
        safety_stock = int(avg_daily_demand * lead_time * 1.5) + 2
        reorder_point = int(avg_daily_demand * lead_time) + safety_stock
        
        # Current Stock simulated with random status (Normal, Low, Critical)
        status_choice = random.choices(["Normal", "Low", "Critical"], weights=[0.70, 0.20, 0.10])[0]
        if status_choice == "Normal":
            current_stock = random.randint(reorder_point + 10, reorder_point + 100)
        elif status_choice == "Low":
            current_stock = random.randint(safety_stock, reorder_point)
        else:
            current_stock = random.randint(0, safety_stock)

        inventory.append({
            "ProductID": prod_id,
            "CurrentStock": current_stock,
            "MinStockLevel": safety_stock,  # Safety stock threshold
            "ReorderPoint": reorder_point,
            "LeadTime": lead_time
        })

    df_inventory = pd.DataFrame(inventory)

    # Save to CSV files
    df_products.to_csv(os.path.join(output_dir, "products_raw.csv"), index=False)
    df_customers.to_csv(os.path.join(output_dir, "customers_raw.csv"), index=False)
    df_sales.to_csv(os.path.join(output_dir, "sales_raw.csv"), index=False)
    df_inventory.to_csv(os.path.join(output_dir, "inventory_raw.csv"), index=False)
    
    print(f"Data generation complete! Saved files to {output_dir}")
    print(f"Generated {len(df_sales)} transactions, {len(df_customers)} customers, {len(df_products)} products.")

if __name__ == "__main__":
    generate_synthetic_data()
