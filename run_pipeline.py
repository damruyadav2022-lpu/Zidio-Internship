import os
import sys

# Ensure project root is in python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from src.data_generator import generate_synthetic_data
from src.etl import run_etl_pipeline
from src.segmentation import run_segmentation
from src.churn import run_churn_prediction
from src.forecasting import run_forecasting
from src.mlops_monitoring import detect_covariate_drift
import mlflow

def main():
    print("=" * 60)
    print("RETAILPULSE - END-TO-END DATA SCIENCE & MLOPS PIPELINE")
    print("=" * 60)
    
    # Define folder paths
    project_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(project_dir, "data")
    db_path = os.path.join(project_dir, "retailpulse.db")
    models_dir = os.path.join(project_dir, "models")
    
    try:
        mlflow.set_experiment("RetailPulse_Master_Pipeline")
        with mlflow.start_run(run_name="Full_Pipeline_Execution"):
            # Step 1: Generate Synthetic Datasets
            print("\n--- STEP 1: DATA GENERATION ---")
            generate_synthetic_data(output_dir=data_dir)
            mlflow.log_param("data_source", "synthetic_retail_transactions")
            
            # Step 2: Run ETL Pipeline
            print("\n--- STEP 2: ETL INGESTION ---")
            run_etl_pipeline(data_dir=data_dir, db_path=db_path)
            mlflow.log_param("db_type", "SQLite")
            
            # Step 3: Customer Segmentation (K-Means)
            print("\n--- STEP 3: CUSTOMER SEGMENTATION ---")
            run_segmentation(db_path=db_path, models_dir=models_dir)
            
            # Step 4: Churn Prediction (Random Forest & XGBoost)
            print("\n--- STEP 4: CHURN PREDICTION (RF & XGBoost) ---")
            run_churn_prediction(db_path=db_path, models_dir=models_dir)
            
            # Step 5: Demand Forecasting & Inventory Optimization (Prophet & PyTorch LSTM)
            print("\n--- STEP 5: DEMAND FORECASTING (PROPHET/RF & PYTORCH LSTM) & INVENTORY ---")
            run_forecasting(db_path=db_path, models_dir=models_dir)
            
            # Step 6: MLOps Observability & Data Drift Detection
            print("\n--- STEP 6: MLOPS MONITORING & DATA DRIFT DETECTION ---")
            detect_covariate_drift(db_path=db_path)
            mlflow.log_param("drift_monitoring_status", "Active")
    except Exception as e:
        print(f"Pipeline execution with MLflow note: {e}")
        # Run sequentially without MLflow wrapper if needed
        print("\n--- STEP 1: DATA GENERATION ---")
        generate_synthetic_data(output_dir=data_dir)
        print("\n--- STEP 2: ETL INGESTION ---")
        run_etl_pipeline(data_dir=data_dir, db_path=db_path)
        print("\n--- STEP 3: CUSTOMER SEGMENTATION ---")
        run_segmentation(db_path=db_path, models_dir=models_dir)
        print("\n--- STEP 4: CHURN PREDICTION ---")
        run_churn_prediction(db_path=db_path, models_dir=models_dir)
        print("\n--- STEP 5: DEMAND FORECASTING & INVENTORY ---")
        run_forecasting(db_path=db_path, models_dir=models_dir)
        print("\n--- STEP 6: MLOPS MONITORING & DRIFT DETECTION ---")
        detect_covariate_drift(db_path=db_path)
    
    print("\n" + "=" * 60)
    print("ALL PIPELINE MODULES COMPLETED SUCCESSFULLY!")
    print(f"Local database initialized at: {db_path}")
    print(f"Model artifacts stored in: {models_dir}")
    print("To launch the interactive dashboard, run:")
    print("  streamlit run dashboard/app.py")
    print("=" * 60)

if __name__ == "__main__":
    main()
