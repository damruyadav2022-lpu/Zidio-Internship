import os
import sqlite3
import numpy as np
import pandas as pd
from scipy.stats import ks_2samp
import mlflow

def calculate_psi(baseline, target, num_buckets=10):
    """
    Computes the Population Stability Index (PSI) between baseline and target distributions.
    PSI < 0.10: No significant change
    0.10 <= PSI < 0.25: Moderate shift
    PSI >= 0.25: Significant data drift detected
    """
    baseline = np.array(baseline).dropna() if hasattr(baseline, 'dropna') else np.array(baseline)
    target = np.array(target).dropna() if hasattr(target, 'dropna') else np.array(target)
    
    if len(baseline) == 0 or len(target) == 0:
        return 0.0
        
    percentiles = np.linspace(0, 100, num_buckets + 1)
    bins = np.percentile(baseline, percentiles)
    bins[0] -= 1e-5
    bins[-1] += 1e-5
    
    baseline_counts, _ = np.histogram(baseline, bins=bins)
    target_counts, _ = np.histogram(target, bins=bins)
    
    # Avoid zero division
    baseline_pct = (baseline_counts + 1e-5) / (len(baseline) + 1e-5 * num_buckets)
    target_pct = (target_counts + 1e-5) / (len(target) + 1e-5 * num_buckets)
    
    psi = np.sum((target_pct - baseline_pct) * np.log(target_pct / baseline_pct))
    return float(psi)

def detect_covariate_drift(db_path="retailpulse.db"):
    """
    Evaluates sales, customer monetary value, and order quantity distributions
    between baseline (year 1) and recent period (latest year) using 2-sample Kolmogorov-Smirnov test.
    """
    conn = sqlite3.connect(db_path)
    df_sales = pd.read_sql_query("SELECT OrderDate, Sales, Quantity, Profit FROM sales", conn)
    df_sales["OrderDate"] = pd.to_datetime(df_sales["OrderDate"])
    
    # Split into baseline (first half of timeline) and current (second half)
    min_date = df_sales["OrderDate"].min()
    max_date = df_sales["OrderDate"].max()
    midpoint = min_date + (max_date - min_date) / 2
    
    baseline_df = df_sales[df_sales["OrderDate"] <= midpoint]
    current_df = df_sales[df_sales["OrderDate"] > midpoint]
    
    features_to_monitor = ["Sales", "Quantity", "Profit"]
    drift_results = []
    
    for feat in features_to_monitor:
        base_vals = baseline_df[feat].values
        curr_vals = current_df[feat].values
        
        stat, p_val = ks_2samp(base_vals, curr_vals)
        psi_val = calculate_psi(base_vals, curr_vals)
        
        drift_detected = bool(p_val < 0.05 or psi_val > 0.20)
        status = "Drift Detected" if drift_detected else "Stable / In Control"
        action = "Trigger automated model retraining & parameter recalibration" if drift_detected else "Maintain current model deployment"
        
        drift_results.append({
            "Feature": feat,
            "BaselineMean": round(float(np.mean(base_vals)), 2),
            "CurrentMean": round(float(np.mean(curr_vals)), 2),
            "KS_Statistic": round(float(stat), 4),
            "P_Value": round(float(p_val), 5),
            "PSI": round(float(psi_val), 4),
            "Status": status,
            "Action": action
        })
        
    df_drift = pd.DataFrame(drift_results)
    df_drift.to_sql("data_drift_monitoring", conn, if_exists="replace", index=False)
    conn.close()
    
    print("Data Drift Monitoring Check Complete:")
    print(df_drift[["Feature", "KS_Statistic", "P_Value", "PSI", "Status"]])
    return df_drift

def fetch_mlflow_runs():
    """
    Queries active MLflow tracking registry experiments and returns a standardized summary DataFrame.
    """
    try:
        experiments = mlflow.search_experiments()
        all_runs = []
        for exp in experiments:
            runs = mlflow.search_runs(experiment_ids=[exp.experiment_id], max_results=10)
            if not runs.empty:
                runs["experiment_name"] = exp.name
                all_runs.append(runs)
                
        if all_runs:
            df_combined = pd.concat(all_runs, ignore_index=True)
            return df_combined
    except Exception as e:
        print(f"MLflow fetch notice: {e}")
    return pd.DataFrame()

if __name__ == "__main__":
    detect_covariate_drift()
