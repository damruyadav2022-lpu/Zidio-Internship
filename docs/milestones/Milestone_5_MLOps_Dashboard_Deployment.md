# Milestone 5: Interactive Dashboard, MLOps, Docker, Kubernetes & CI/CD

**Project**: RetailPulse – AI-Powered Customer Analytics & Demand Forecasting Platform  
**Milestone**: 5 of 5 (Production Dashboard, MLOps Observability & Cloud Deployment)  
**Status**: Completed (Submission Ready)

---

## 1. Executive Summary
Milestone 5 brings RetailPulse into a fully realized, production-grade cloud analytics platform. It introduces:
1. An interactive, dark-themed **Streamlit Web Application** covering 6 operational views.
2. An **MLOps Observability Suite** featuring live **MLflow experiment tracking** and continuous **Covariate Data Drift Monitoring** (2-sample Kolmogorov-Smirnov test and Population Stability Index).
3. Production containerization via **Docker** and **Docker Compose**.
4. Scalable orchestration via **Kubernetes Manifests** (Deployment, Service, ConfigMap).
5. Continuous integration and testing via **GitHub Actions CI/CD**.
6. A 100% passing automated test suite (`pytest`).

---

## 2. Interactive Streamlit Web Application (`dashboard/app.py`)

The application features 6 specialized analytics and decision-support pages:

1. **Business Overview Dashboard**:
   - Executive KPIs: Total Revenue, Total Profit, Profit Margin %, Total Orders, Active Customers.
   - Monthly revenue trends area charts.
   - Revenue breakdown by Category and Regional market distribution.
2. **Customer Segmentation (RFM Analysis)**:
   - RFM 3D interactive scatter plot.
   - Persona composition donut chart.
   - Cluster evaluation metrics: Optimal $K=4$, Silhouette Score (**0.6557**), Davies-Bouldin Index (**0.4905**).
   - Persona profiles with specific marketing action strategies.
   - Customer filter and CSV export.
3. **Churn Analytics**:
   - Model benchmark evaluation: Random Forest vs XGBoost Classifier.
   - Champion model indicator (**XGBoost: ROC-AUC 0.9615**).
   - High-risk retention candidate action list with CSV export.
   - Behavioral feature importance rankings.
   - Real-time customer search & churn risk calculator.
4. **AI Demand Forecasting**:
   - 30-day forward projections with confidence intervals.
   - Side-by-side or combined overlay of **Baseline Model (Random Forest)** vs **PyTorch Deep Learning LSTM**.
   - Model accuracy metrics comparison table (MAPE, RMSE, MAE).
5. **Inventory Optimization**:
   - Stock health KPI cards (Healthy, Yellow Reorder, Red Critical).
   - Interactive **What-If Lead Time & Safety Stock Simulator**.
   - Replenishment Matrix table with color-coded status badges.
   - One-click purchase replenishment order CSV export.
6. **MLOps Observability & Drift Monitoring**:
   - Active Model Registry table summarizing parameters and accuracy metrics across all deployed models.
   - Statistical Covariate Drift Detection table (KS-statistic, p-values, PSI, and status).
   - Empirical probability density histograms comparing baseline vs current timeline distributions.
   - Automated retraining alert trigger banner.

---

## 3. MLOps Observability & Data Drift Detection (`src/mlops_monitoring.py`)

To ensure models maintain performance in changing retail environments, RetailPulse incorporates automated distribution drift checks:

### 3.1 Statistical Testing Methodology
- **2-Sample Kolmogorov-Smirnov (KS) Test**: Evaluates whether current transaction features originate from the baseline distribution ($p < 0.05$ indicates drift).
- **Population Stability Index (PSI)**: Measures divergence across ten decile buckets:
  $$\text{PSI} = \sum \left( \% \text{Target} - \% \text{Baseline} \right) \times \ln\left( \frac{\% \text{Target}}{\% \text{Baseline}} \right)$$

### 3.2 Live Monitoring Results

| Feature Monitored | KS Statistic | P-Value | PSI | Drift Status | MLOps Action |
|---|---|---|---|---|---|
| **Sales Revenue** | 0.0070 | 0.18007 | 0.0004 | **Stable / In Control** | Maintain current model |
| **Order Quantity** | 0.0243 | 0.00000 | 0.0035 | **Drift Detected** | Trigger automated retraining |
| **Profit Margin** | 0.0056 | 0.42555 | 0.0003 | **Stable / In Control** | Maintain current model |

---

## 4. Containerization & Orchestration

### 4.1 Production Dockerfile (`Dockerfile`)
- Multi-stage build based on `python:3.11-slim`.
- Installs necessary system libraries and compiles dependencies without caching.
- Executes pipeline build to initialize database and model weights.
- Incorporates native Docker health checks (`/_stcore/health`).
- Exposes Streamlit port `8501`.

### 4.2 Docker Compose (`docker-compose.yml`)
Orchestrates the multi-service architecture:
- `retailpulse-app`: Streamlit dashboard with persistent SQLite and model volumes.
- `mlflow-server`: Dedicated MLflow tracking server on port `5000` with local artifact storage.

### 4.3 Kubernetes Deployment (`k8s/`)
- `k8s/deployment.yaml`: Configures 2-replica pod deployment with rolling updates, resource requests/limits (1Gi memory, 500m CPU), and liveness/readiness probes.
- `k8s/service.yaml`: Configures a LoadBalancer service mapping external port 80 to container port 8501.
- `k8s/configmap.yaml`: Centralized environment configurations.

---

## 5. Automated CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

The GitHub Actions workflow triggers on pushes and pull requests to `main`:
1. **Linting**: Code quality checks with `flake8`.
2. **Pipeline Build**: Executes `run_pipeline.py` to verify data flow.
3. **Automated Testing**: Executes `pytest tests/ -v` ensuring 100% test pass rate.
4. **Container Build**: Builds and validates Docker image.

---

## 6. Automated Test Suite Validation

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

======================== 9 passed, 1 warning in 7.07s =========================
```

---

## 7. Milestone Deliverables Checklist
- [x] Streamlit multi-tab web application (`dashboard/app.py`)
- [x] MLflow experiment registry and tracking logs (`src/mlops_monitoring.py`)
- [x] Statistical data drift detection engine (KS-test & PSI)
- [x] Production Dockerfile with health checks
- [x] Docker Compose multi-service specification
- [x] Kubernetes manifests (`deployment.yaml`, `service.yaml`, `configmap.yaml`)
- [x] GitHub Actions CI/CD workflow (`.github/workflows/ci-cd.yml`)
- [x] 9-test automated verification suite passing 100%
