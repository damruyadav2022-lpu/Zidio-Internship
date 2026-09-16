import os
import pickle
import sqlite3
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

def run_churn_prediction(db_path="e:/Zidio Internship/RetailPulse/retailpulse.db", models_dir="e:/Zidio Internship/RetailPulse/models"):
    """
    Trains a Random Forest classifier to predict customer churn risk without data leakage,
    and logs risk scores for all active customers.
    """
    print("Starting Churn Prediction training...")
    os.makedirs(models_dir, exist_ok=True)
    
    # 1. Ingest transaction data
    conn = sqlite3.connect(db_path)
    query = """
        SELECT OrderID, OrderDate, CustomerID, Sales, Quantity, Discount, Profit
        FROM sales
    """
    df_sales = pd.read_sql_query(query, conn)
    df_sales["OrderDate"] = pd.to_datetime(df_sales["OrderDate"])
    
    # Snapshot date is 1 day after the last order
    snapshot_date = df_sales["OrderDate"].max() + pd.Timedelta(days=1)
    
    # Calculate lifetime and active window for each customer
    customer_dates = df_sales.groupby("CustomerID").agg(
        FirstPurchase=("OrderDate", "min"),
        LastPurchase=("OrderDate", "max"),
        Monetary=("Sales", "sum"),
        Frequency=("OrderID", "nunique"),
        TotalQty=("Quantity", "sum"),
        AvgDiscount=("Discount", "mean"),
        TotalProfit=("Profit", "sum")
    ).reset_index()
    
    # Calculate Recency (days since last purchase to snapshot date)
    customer_dates["Recency"] = (snapshot_date - customer_dates["LastPurchase"]).dt.days
    
    # Define Target Label (Churn = 1 if inactive for > 90 days, else 0)
    customer_dates["Churn"] = (customer_dates["Recency"] > 90).astype(int)
    
    # 2. Advanced Feature Engineering (Data-Leakage Free)
    # We must exclude Recency and LastPurchase as features since they directly define the target.
    
    # Compute Average Purchase Interval (days between orders)
    purchase_intervals = []
    for cust_id in customer_dates["CustomerID"]:
        cust_orders = df_sales[df_sales["CustomerID"] == cust_id].sort_values("OrderDate")
        unique_dates = cust_orders["OrderDate"].unique()
        if len(unique_dates) > 1:
            diffs = np.diff(unique_dates) / np.timedelta64(1, 'D')
            mean_diff = diffs.mean()
        else:
            mean_diff = 180.0  # High default value for single-purchase customers
        purchase_intervals.append(mean_diff)
    
    customer_dates["PurchaseInterval"] = purchase_intervals
    
    # Compute basic behavioral features
    customer_dates["AOV"] = customer_dates["Monetary"] / customer_dates["Frequency"]
    customer_dates["ProfitMargin"] = customer_dates["TotalProfit"] / (customer_dates["Monetary"] + 1e-5)
    customer_dates["AvgQuantityPerOrder"] = customer_dates["TotalQty"] / customer_dates["Frequency"]
    
    # Compute Trend Feature: Spending in the second half of customer lifetime vs first half
    trend_ratios = []
    for idx, row in customer_dates.iterrows():
        cust_id = row["CustomerID"]
        first_p = row["FirstPurchase"]
        last_p = row["LastPurchase"]
        midpoint = first_p + (last_p - first_p) / 2
        
        cust_sales = df_sales[df_sales["CustomerID"] == cust_id]
        
        sales_first_half = cust_sales[cust_sales["OrderDate"] <= midpoint]["Sales"].sum()
        sales_second_half = cust_sales[cust_sales["OrderDate"] > midpoint]["Sales"].sum()
        
        # Calculate ratio of late spending to early spending
        ratio = (sales_second_half + 1.0) / (sales_first_half + 1.0)
        trend_ratios.append(ratio)
        
    customer_dates["SpendingTrend"] = trend_ratios

    # Feature List
    feature_cols = [
        "Frequency", 
        "Monetary", 
        "PurchaseInterval", 
        "AOV", 
        "ProfitMargin", 
        "AvgQuantityPerOrder", 
        "AvgDiscount", 
        "SpendingTrend"
    ]
    
    X = customer_dates[feature_cols]
    y = customer_dates["Churn"]

    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    from xgboost import XGBClassifier
    import mlflow

    # 3. Model Training & Benchmarking: Random Forest vs XGBoost
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    
    # Train Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_prob = rf.predict_proba(X_test)[:, 1]
    rf_auc = roc_auc_score(y_test, rf_prob)
    rf_acc = accuracy_score(y_test, rf_pred)
    rf_prec = precision_score(y_test, rf_pred, zero_division=0)
    rf_rec = recall_score(y_test, rf_pred, zero_division=0)
    rf_f1 = f1_score(y_test, rf_pred, zero_division=0)
    
    # Train XGBoost
    xgb = XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.08, random_state=42, eval_metric="logloss")
    xgb.fit(X_train, y_train)
    xgb_pred = xgb.predict(X_test)
    xgb_prob = xgb.predict_proba(X_test)[:, 1]
    xgb_auc = roc_auc_score(y_test, xgb_prob)
    xgb_acc = accuracy_score(y_test, xgb_pred)
    xgb_prec = precision_score(y_test, xgb_pred, zero_division=0)
    xgb_rec = recall_score(y_test, xgb_pred, zero_division=0)
    xgb_f1 = f1_score(y_test, xgb_pred, zero_division=0)
    
    print("\n--- MODEL BENCHMARK RESULTS ---")
    print(f"Random Forest  -> ROC-AUC: {rf_auc:.4f} | Accuracy: {rf_acc:.4f} | F1: {rf_f1:.4f}")
    print(f"XGBoost        -> ROC-AUC: {xgb_auc:.4f} | Accuracy: {xgb_acc:.4f} | F1: {xgb_f1:.4f}")
    
    # Choose champion model based on ROC-AUC
    if xgb_auc >= rf_auc:
        champion_model = xgb
        champion_name = "XGBoost Classifier"
        champ_prob = xgb_prob
        importances_arr = xgb.feature_importances_
    else:
        champion_model = rf
        champion_name = "Random Forest Classifier"
        champ_prob = rf_prob
        importances_arr = rf.feature_importances_
        
    print(f"\nChampion Model Selected: {champion_name}")

    # Save benchmark table
    benchmark_df = pd.DataFrame([
        {"Model": "Random Forest", "Accuracy": round(rf_acc, 4), "Precision": round(rf_prec, 4), "Recall": round(rf_rec, 4), "F1_Score": round(rf_f1, 4), "ROC_AUC": round(rf_auc, 4), "Champion": "Yes" if champion_name == "Random Forest Classifier" else "No"},
        {"Model": "XGBoost", "Accuracy": round(xgb_acc, 4), "Precision": round(xgb_prec, 4), "Recall": round(xgb_rec, 4), "F1_Score": round(xgb_f1, 4), "ROC_AUC": round(xgb_auc, 4), "Champion": "Yes" if champion_name == "XGBoost Classifier" else "No"}
    ])
    benchmark_df.to_sql("churn_model_comparison", conn, if_exists="replace", index=False)

    # MLflow Tracking
    try:
        mlflow.set_experiment("RetailPulse_Churn_Prediction")
        with mlflow.start_run(run_name="Random_Forest_Classifier", nested=True):
            mlflow.log_param("n_estimators", 100)
            mlflow.log_param("max_depth", 8)
            mlflow.log_metric("roc_auc", rf_auc)
            mlflow.log_metric("accuracy", rf_acc)
            mlflow.log_metric("f1_score", rf_f1)
            
        with mlflow.start_run(run_name="XGBoost_Classifier", nested=True):
            mlflow.log_param("n_estimators", 100)
            mlflow.log_param("learning_rate", 0.08)
            mlflow.log_metric("roc_auc", xgb_auc)
            mlflow.log_metric("accuracy", xgb_acc)
            mlflow.log_metric("f1_score", xgb_f1)
    except Exception as e:
        print(f"MLflow logging notice: {e}")

    # Save Champion Model
    with open(os.path.join(models_dir, "churn_rf_model.pkl"), "wb") as f:
        pickle.dump(champion_model, f)
    with open(os.path.join(models_dir, "churn_features.pkl"), "wb") as f:
        pickle.dump(feature_cols, f)
        
    # 4. Generate Predictions for Active Customers
    active_customers = customer_dates[customer_dates["Churn"] == 0].copy()
    X_active = active_customers[feature_cols]
    
    active_customers["ChurnProbability"] = champion_model.predict_proba(X_active)[:, 1]
    active_customers["RiskLevel"] = np.where(
        active_customers["ChurnProbability"] >= 0.70, "High Risk",
        np.where(active_customers["ChurnProbability"] >= 0.40, "Medium Risk", "Low Risk")
    )
    
    # Save active predictions to database
    active_predictions = active_customers[["CustomerID", "Frequency", "Monetary", "Recency", "ChurnProbability", "RiskLevel"]]
    active_predictions.to_sql("churn_predictions", conn, if_exists="replace", index=False)
    
    # Save feature importances
    importances = pd.DataFrame({
        "Feature": feature_cols,
        "Importance": importances_arr
    }).sort_values("Importance", ascending=False)
    importances.to_sql("churn_feature_importances", conn, if_exists="replace", index=False)
    
    # Generate high-risk customer alert list with recommended actions
    high_risk = active_customers[active_customers["ChurnProbability"] >= 0.60].copy()
    df_cust = pd.read_sql_query("SELECT CustomerID, CustomerName, Segment, Region FROM customers", conn)
    high_risk = high_risk.merge(df_cust, on="CustomerID", how="left")
    
    high_risk["RecommendedAction"] = np.where(
        high_risk["Segment"] == "VIP Champions", "High-Priority Account Manager Outreach & Loyalty Bonus",
        np.where(high_risk["Monetary"] > 1000, "15% Exclusive Discount Voucher via SMS/Email", "Targeted Re-Engagement Campaign with Free Shipping")
    )
    high_risk = high_risk[["CustomerID", "CustomerName", "Segment", "Region", "Monetary", "Recency", "ChurnProbability", "RecommendedAction"]]
    high_risk.to_sql("churn_high_risk_alerts", conn, if_exists="replace", index=False)
    
    conn.close()
    print("Churn prediction pipeline complete! Predictions, benchmark, and alerts saved to database.")

if __name__ == "__main__":
    run_churn_prediction()
