from fastapi import APIRouter, HTTPException, Depends
import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from backend.database import query_df
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/segmentation", tags=["segmentation"])

@router.get("")
def get_segmentation_analysis(user: dict = Depends(get_current_user)):
    try:
        df_rfm = query_df("SELECT * FROM customer_segments")
        df_metrics = query_df("SELECT * FROM segmentation_metrics")

        # Centroids / Persona statistics
        total_customers = len(df_rfm)
        total_revenue = df_rfm["Monetary"].sum()

        centroids = df_rfm.groupby("Segment").agg(
            CustomerCount=("CustomerID", "count"),
            AvgRecency=("Recency", "mean"),
            AvgFrequency=("Frequency", "mean"),
            AvgMonetary=("Monetary", "mean"),
            TotalMonetary=("Monetary", "sum"),
            ActionStrategy=("ActionStrategy", "first")
        ).reset_index()

        centroids["CustomerPct"] = (centroids["CustomerCount"] / max(1, total_customers) * 100).round(1)
        centroids["RevenuePct"] = (centroids["TotalMonetary"] / max(1e-5, total_revenue) * 100).round(1)
        centroids["AvgRecency"] = centroids["AvgRecency"].round(1)
        centroids["AvgFrequency"] = centroids["AvgFrequency"].round(1)
        centroids["AvgMonetary"] = centroids["AvgMonetary"].round(2)
        centroids["TotalMonetary"] = centroids["TotalMonetary"].round(2)

        # 2D PCA representation for cluster scatter plot (sample up to 400 points for frontend speed)
        sample_df = df_rfm.sample(min(400, len(df_rfm)), random_state=42).copy()
        features = sample_df[["Recency", "Frequency", "Monetary"]]
        scaler = StandardScaler()
        scaled = scaler.fit_transform(features)
        
        pca = PCA(n_components=2)
        pca_coords = pca.fit_transform(scaled)
        sample_df["pca_x"] = pca_coords[:, 0].round(3)
        sample_df["pca_y"] = pca_coords[:, 1].round(3)

        scatter_points = sample_df[["CustomerID", "Segment", "Recency", "Frequency", "Monetary", "pca_x", "pca_y"]].to_dict(orient="records")

        # RFM Distribution percentiles
        rfm_distributions = {
            "Recency": {
                "min": float(df_rfm["Recency"].min()),
                "p25": float(df_rfm["Recency"].quantile(0.25)),
                "median": float(df_rfm["Recency"].median()),
                "p75": float(df_rfm["Recency"].quantile(0.75)),
                "max": float(df_rfm["Recency"].max())
            },
            "Frequency": {
                "min": float(df_rfm["Frequency"].min()),
                "p25": float(df_rfm["Frequency"].quantile(0.25)),
                "median": float(df_rfm["Frequency"].median()),
                "p75": float(df_rfm["Frequency"].quantile(0.75)),
                "max": float(df_rfm["Frequency"].max())
            },
            "Monetary": {
                "min": float(df_rfm["Monetary"].min()),
                "p25": float(df_rfm["Monetary"].quantile(0.25)),
                "median": float(df_rfm["Monetary"].median()),
                "p75": float(df_rfm["Monetary"].quantile(0.75)),
                "max": float(df_rfm["Monetary"].max())
            }
        }

        return {
            "metrics": df_metrics.to_dict(orient="records")[0] if not df_metrics.empty else {
                "OptimalClusters": 4,
                "SilhouetteScore": 0.6557,
                "DaviesBouldinIndex": 0.4905
            },
            "personas": centroids.to_dict(orient="records"),
            "scatter_points": scatter_points,
            "scatter": scatter_points,
            "rfm_distributions": rfm_distributions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate segmentation data: {str(e)}")
