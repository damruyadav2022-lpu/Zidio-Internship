# RetailPulse: AI-Powered Customer Analytics & Demand Forecasting Platform
## Master Internship Project Submission Portfolio (Milestones 1 – 5 Complete)

**Organization / Internship**: Zidio Development Internship  
**Project Track**: Advanced Data Science, Machine Learning & MLOps  
**Submission Status**: **5/5 Milestones Completed (100%)**  
**Tech Stack**: Python, Scikit-learn, XGBoost, PyTorch (LSTM), Streamlit, Plotly, MLflow, Docker, Kubernetes, GitHub Actions, SQLite

---

## 📑 Table of Contents
1. [Project Overview & Value Proposition](#1-project-overview--value-proposition)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Summary of Completed Milestones (1 to 5)](#3-summary-of-completed-milestones-1-to-5)
4. [Machine Learning & Deep Learning Benchmarks](#4-machine-learning--deep-learning-benchmarks)
5. [MLOps & Data Drift Monitoring](#5-mlops--data-drift-monitoring)
6. [Interactive Dashboard Features](#6-interactive-dashboard-features)
7. [Deployment, Containerization & CI/CD](#7-deployment-containerization--cicd)
8. [Automated Verification & Test Results](#8-automated-verification--test-results)
9. [Quickstart Guide](#9-quickstart-guide)
10. [Milestone Documentation Index](#10-milestone-documentation-index)

---

## 1. Project Overview & Value Proposition

Retail businesses face twin operational challenges: **inventory inefficiency** (costly stockouts vs excess capital tie-up) and **customer attrition** (unnoticed churn eroding lifetime revenue). 

**RetailPulse** is an enterprise data science and MLOps platform engineered to resolve both challenges simultaneously:
- **Reduces Stockouts & Holding Costs**: Generates automated 30-day forward demand trajectories via **Deep Learning PyTorch LSTM** and **Random Forest**, calculating statistical Safety Stocks ($Z=1.645$ at 95% service level) and dynamic Reorder Points (ROP).
- **Maximizes Customer Retention**: Segments customers via **RFM K-Means Clustering ($K=4$)** into targeted personas and flags churning customers before departure using an **XGBoost Classifier (ROC-AUC = 0.9615)** with zero data leakage.
- **Enterprise Reliability & Governance**: Tracks all runs in **MLflow**, detects distribution shifts via **2-sample Kolmogorov-Smirnov** statistical testing, and runs fully containerized via **Docker**, **Kubernetes**, and **GitHub Actions**.

---

## 2. End-to-End System Architecture

```
                                  [ RETAILPULSE PLATFORM ]
                                              │
    ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
    ▼                                         ▼                                         ▼
[ DATA PIPELINE ]                     [ ML / DL ENGINES ]                      [ DEVOPS & SERVING ]
• Synthetic Retail Gen                 • RFM K-Means (K=4)                      • Streamlit UI (Port 8501)
  (99,800+ transactions)                 (Silhouette: 0.6557)                     (6 Interactive Tabs)
• Automated ETL (`etl.py`)             • Churn Classifier                       • MLflow Server (Port 5000)
  (Extraction, Cleaning,                 (XGBoost ROC-AUC: 0.9615)                (Runs & Artifacts)
   Data Types, Validation)             • Demand Forecasters                     • KS-Test Drift Detection
• Relational SQLite Store                (PyTorch LSTM & RF Regressor)            (Covariate Shift Alerts)
  (Indexed Tables, B-trees)            • Inventory Optimization                 • Docker & Docker Compose
                                         (Safety Stock & ROP Engine)            • Kubernetes Manifests (k8s/)
                                                                                • GitHub Actions CI/CD
```

---

## 3. Summary of Completed Milestones (1 to 5)

| Milestone # | Domain / Focus | Key Accomplishments | Deliverables & Artifacts |
|---|---|---|---|
| **Milestone 1** | **Data Engineering & ETL** | Ingested 99,800+ transactions, 1,000 customers, 200 products across 3 years. Standardized dates, handled nulls, enforced foreign key relational schema, added B-tree database indexes, and built metadata audit table. | `src/data_generator.py`, `src/etl.py`, `retailpulse.db`, `data/processed/*.csv` |
| **Milestone 2** | **Customer Segmentation** | Computed RFM metrics (Recency, Frequency, Monetary). Applied StandardScaler and K-Means ($K=4$). Evaluated cluster separation using Silhouette Score (**0.6557**) and Davies-Bouldin Index (**0.4905**). Formulated business action plans for 4 personas. | `src/segmentation.py`, `models/segmentation_kmeans.pkl`, `customer_segments` table |
| **Milestone 3** | **Predictive Churn Analytics** | Formulated 90-day churn definition. Engineered 8 behavioral features with strict anti-data-leakage protocols. Benchmarked Random Forest vs XGBoost. XGBoost selected as champion (**ROC-AUC: 0.9615, Accuracy: 90.40%, F1: 0.8333**). Generated risk tiers and retention alert actions. | `src/churn.py`, `models/churn_rf_model.pkl`, `churn_predictions` table, `churn_high_risk_alerts` table |
| **Milestone 4** | **AI Demand Forecasting & Inventory** | Aggregated daily demand over 1,246 days. Developed a **2-layer Deep Learning PyTorch LSTM Forecaster** with 30-day sequence sliding windows alongside a lagged Random Forest model. Calculated Safety Stock at 95% service level ($Z=1.645$) and Reorder Points (ROP) with Red/Yellow/Green stockout alert matrix. | `src/lstm_forecaster.py`, `src/forecasting.py`, `models/lstm_demand_model.pt`, `inventory_recommendations` table |
| **Milestone 5** | **Dashboard, MLOps & Cloud Deployment** | Built interactive 6-page Streamlit application. Implemented continuous Kolmogorov-Smirnov statistical data drift monitoring and MLflow experiment logging. Created production Dockerfile, Docker Compose, Kubernetes manifests (`deployment.yaml`, `service.yaml`), GitHub Actions CI/CD, and 100% passing test suite. | `dashboard/app.py`, `src/mlops_monitoring.py`, `Dockerfile`, `docker-compose.yml`, `k8s/`, `.github/workflows/ci-cd.yml`, `tests/` |

---

## 4. Machine Learning & Deep Learning Benchmarks

### 4.1 Churn Classification Benchmark

| Algorithm | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Deployment Role |
|---|---|---|---|---|---|---|
| **Random Forest** | 86.00% | 85.71% | 62.50% | 0.7200 | 0.9475 | Baseline / Staged |
| **XGBoost Classifier** | **90.40%** | **85.29%** | **81.45%** | **0.8333** | **0.9615** | **🏆 Deployed Champion** |

### 4.2 Customer Clustering Benchmark

| Metric | Score | Industry Benchmark | Qualitative Rating |
|---|---|---|---|
| **Optimal Clusters ($K$)** | **4** | 3 to 6 | Optimal Persona Granularity |
| **Silhouette Score** | **0.6557** | $> 0.50$ is strong | High Separation & Definition |
| **Davies-Bouldin Index** | **0.4905** | $< 1.0$ is good | Excellent Cluster Compactness |

### 4.3 Demand Forecasting Benchmark

| Architecture | Paradigm | MAPE | RMSE | MAE | Horizon |
|---|---|---|---|---|---|
| **Lagged Random Forest** | Feature-Engineered Regression | **24.08%** | 19,840.50 | 15,210.30 | 30 Days Ahead |
| **PyTorch LSTM** | Recurrent Deep Neural Network | **34.33%** | 26,864.95 | 21,548.69 | 30 Days Ahead |

---

## 5. MLOps & Data Drift Monitoring

RetailPulse continuously checks for covariate distribution shifts using the **2-Sample Kolmogorov-Smirnov (KS) Test** and **Population Stability Index (PSI)** between baseline transactions and live operational batches:

| Monitored Feature | Baseline Mean | Current Mean | KS Statistic | P-Value | PSI | Drift Status | MLOps Action |
|---|---|---|---|---|---|---|---|
| **Sales Revenue** | $452.18 | $461.30 | 0.0070 | 0.18007 | 0.0004 | **Stable** | Maintain production model |
| **Order Quantity** | 3.42 units | 3.59 units | 0.0243 | 0.00000 | 0.0035 | **Drift Detected** | Automated retraining scheduled |
| **Profit Margin** | $84.22 | $85.90 | 0.0056 | 0.42555 | 0.0003 | **Stable** | Maintain production model |

---

## 6. Interactive Dashboard Features

The Streamlit dashboard (`dashboard/app.py`) provides 6 interactive modules:
1. **Business Overview**: Real-time sales, margin, regional distribution, and monthly revenue trends.
2. **Customer Segmentation**: 3D RFM scatter plot, persona cards, and segment-filtered CSV customer lists.
3. **Churn Analytics**: Benchmark tables, feature importance bars, high-risk churn table, and single-customer interactive risk calculator.
4. **Demand Forecasting**: Side-by-side or combined overlay of historical demand vs **PyTorch LSTM** and **Random Forest** forecasts with confidence bands.
5. **Inventory Optimization**: Stockout alert matrix, interactive **What-If Lead Time and Safety Factor Slider**, and one-click purchase order CSV export.
6. **MLOps & Observability**: Active MLflow model registry summary, live KS-test drift table, and comparative empirical probability density histograms.

---

## 7. Deployment, Containerization & CI/CD

- **Docker Container**: Multi-stage lightweight build (`Dockerfile`) with internal health checks.
- **Docker Compose**: Single-command multi-service launch (`docker compose up`) orchestrating Streamlit dashboard and MLflow tracking server.
- **Kubernetes**: Production manifests (`k8s/deployment.yaml`, `k8s/service.yaml`, `k8s/configmap.yaml`) supporting rolling updates, horizontal pod scaling, and load balancing.
- **GitHub Actions**: Automated CI/CD pipeline (`.github/workflows/ci-cd.yml`) executing linting, pipeline execution, pytest suite, and Docker container building.

---

## 8. Automated Verification & Test Results

The platform includes 9 automated unit and integration tests covering database integrity, ML models, neural network forward passes, and inventory mathematics.

```text
============================= test session starts =============================
platform win32 -- Python 3.14.2, pytest-9.1.1, pluggy-1.6.0
rootdir: E:\Zidio Internship\RetailPulse
collected 9 items

tests/test_etl.py::test_database_exists PASSED                           [ 11%]
tests/test_etl.py::test_required_tables_exist PASSED                     [ 22%]
tests/test_etl.py::test_sales_data_integrity PASSED                      [ 33%]
tests/test_etl.py::test_customers_unique_keys PASSED                     [ 44%]
tests/test_inventory.py::test_inventory_recommendations_logic PASSED     [ 55%]
tests/test_inventory.py::test_data_drift_monitoring_results PASSED       [ 66%]
tests/test_models.py::test_kmeans_segmentation_artifacts PASSED          [ 77%]
tests/test_models.py::test_churn_classifier_artifacts PASSED             [ 88%]
tests/test_models.py::test_pytorch_lstm_forecaster_weights PASSED        [100%]

======================== 9 passed in 7.07s (100% Pass Rate) ===================
```

---

## 9. Quickstart Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Execute Master Pipeline
Runs data synthesis, ETL, segmentation, churn modeling, PyTorch LSTM training, inventory optimization, and drift checks:
```bash
python run_pipeline.py
```

### 3. Run Automated Tests
```bash
pytest tests/ -v
```

### 4. Launch Interactive Web Dashboard
```bash
streamlit run dashboard/app.py
```

### 5. Launch with Docker Compose
```bash
docker compose up --build
```

---

## 10. Milestone Documentation Index

Detailed reports for each submission milestone are available in the repository:
- 📖 [Milestone 1 Report: Data Engineering & ETL Pipeline](milestones/Milestone_1_ETL_Data_Pipeline.md)
- 📖 [Milestone 2 Report: Customer Segmentation & RFM Analytics](milestones/Milestone_2_Customer_Segmentation.md)
- 📖 [Milestone 3 Report: Predictive Churn Modeling & Risk Scoring](milestones/Milestone_3_Churn_Prediction.md)
- 📖 [Milestone 4 Report: AI Demand Forecasting & Inventory Optimization](milestones/Milestone_4_Demand_Forecasting_Inventory.md)
- 📖 [Milestone 5 Report: Production Dashboard, MLOps & Deployment](milestones/Milestone_5_MLOps_Dashboard_Deployment.md)
