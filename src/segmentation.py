import os
import pickle
import sqlite3
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

def run_segmentation(db_path="e:/Zidio Internship/RetailPulse/retailpulse.db", models_dir="e:/Zidio Internship/RetailPulse/models"):
    """
    Performs RFM analysis and KMeans clustering to segment customers based on purchasing behavior.
    """
    print("Starting Customer Segmentation...")
    os.makedirs(models_dir, exist_ok=True)
    
    # 1. Load data from SQLite database
    conn = sqlite3.connect(db_path)
    query = """
        SELECT OrderID, OrderDate, CustomerID, Sales
        FROM sales
    """
    df_sales = pd.read_sql_query(query, conn)
    df_sales["OrderDate"] = pd.to_datetime(df_sales["OrderDate"])
    
    # Find the snapshot date (1 day after the last order in the dataset)
    snapshot_date = df_sales["OrderDate"].max() + pd.Timedelta(days=1)
    
    # 2. Calculate RFM Metrics
    # Recency: days since last purchase
    # Frequency: unique order count
    # Monetary: sum of sales
    rfm = df_sales.groupby("CustomerID").agg({
        "OrderDate": lambda x: (snapshot_date - x.max()).days,
        "OrderID": "nunique",
        "Sales": "sum"
    }).rename(columns={
        "OrderDate": "Recency",
        "OrderID": "Frequency",
        "Sales": "Monetary"
    }).reset_index()
    
    print(f"Calculated RFM metrics for {len(rfm)} unique customers.")

    # 3. Standardize RFM data
    scaler = StandardScaler()
    rfm_scaled = scaler.fit_transform(rfm[["Recency", "Frequency", "Monetary"]])
    
    from sklearn.metrics import silhouette_score, davies_bouldin_score
    import mlflow
    
    # 4. Fit KMeans
    # We use K=4 for distinct and actionable customer personas
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    rfm["Cluster"] = kmeans.fit_predict(rfm_scaled)
    
    sil_score = float(silhouette_score(rfm_scaled, rfm["Cluster"]))
    db_score = float(davies_bouldin_score(rfm_scaled, rfm["Cluster"]))
    print(f"K-Means Evaluation: Silhouette Score = {sil_score:.4f}, Davies-Bouldin Index = {db_score:.4f}")
    
    # 5. Dynamically Label Clusters based on their centroids
    # Compute centroid means for each cluster
    cluster_means = rfm.groupby("Cluster").agg({
        "Recency": "mean",
        "Frequency": "mean",
        "Monetary": "mean"
    })
    
    cluster_labels = {}
    
    # Sort clusters by Monetary mean
    sorted_by_monetary = cluster_means.sort_values(by="Monetary", ascending=False).index.tolist()
    cluster_labels[sorted_by_monetary[0]] = "VIP Champions"
    
    sorted_by_recency = cluster_means.sort_values(by="Recency", ascending=False).index.tolist()
    lost_cluster = sorted_by_recency[0]
    cluster_labels[lost_cluster] = "Lost Customers"
    
    remaining = [c for c in [0, 1, 2, 3] if c not in cluster_labels]
    
    if len(remaining) == 2:
        c1, c2 = remaining[0], remaining[1]
        if cluster_means.loc[c1, "Recency"] < cluster_means.loc[c2, "Recency"]:
            cluster_labels[c1] = "New & Promising"
            cluster_labels[c2] = "At Risk / Slipping"
        else:
            cluster_labels[c1] = "At Risk / Slipping"
            cluster_labels[c2] = "New & Promising"
    else:
        for idx, cluster in enumerate(remaining):
            cluster_labels[cluster] = f"Regular Group {idx+1}"
            
    rfm["Segment"] = rfm["Cluster"].map(cluster_labels)
    
    # Define actionable business strategy per persona
    persona_actions = {
        "VIP Champions": "Reward loyalty with VIP preview events, concierge perks & exclusive bundles",
        "New & Promising": "Nurture onboarding with welcome discounts, product recommendations & follow-up surveys",
        "At Risk / Slipping": "Send proactive re-engagement email with limited-time 15% incentive coupon",
        "Lost Customers": "Execute win-back automated campaign; conduct exit surveys to diagnose attrition"
    }
    rfm["ActionStrategy"] = rfm["Segment"].map(persona_actions)
    
    # 6. Save segment mapping and evaluation metrics back to database
    rfm.to_sql("customer_segments", conn, if_exists="replace", index=False)
    
    metrics_df = pd.DataFrame([{
        "Optimal_K": 4,
        "SilhouetteScore": round(sil_score, 4),
        "DaviesBouldinIndex": round(db_score, 4),
        "TotalCustomers": len(rfm)
    }])
    metrics_df.to_sql("segmentation_metrics", conn, if_exists="replace", index=False)
    conn.close()
    
    # 7. Save models
    with open(os.path.join(models_dir, "segmentation_kmeans.pkl"), "wb") as f:
        pickle.dump(kmeans, f)
    with open(os.path.join(models_dir, "segmentation_scaler.pkl"), "wb") as f:
        pickle.dump(scaler, f)
        
    # MLflow Tracking
    try:
        mlflow.set_experiment("RetailPulse_Customer_Segmentation")
        with mlflow.start_run(run_name="KMeans_RFM_Clustering", nested=True):
            mlflow.log_param("n_clusters", 4)
            mlflow.log_param("features", "Recency, Frequency, Monetary")
            mlflow.log_metric("silhouette_score", sil_score)
            mlflow.log_metric("davies_bouldin_index", db_score)
            mlflow.log_metric("customer_count", len(rfm))
    except Exception as e:
        print(f"MLflow logging notice: {e}")
        
    print("Customer segmentation completed successfully!")
    print(rfm["Segment"].value_counts())

if __name__ == "__main__":
    run_segmentation()
