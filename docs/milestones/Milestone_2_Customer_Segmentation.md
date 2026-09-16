# Milestone 2: Customer Segmentation & Behavioral Analytics

**Project**: RetailPulse – AI-Powered Customer Analytics & Demand Forecasting Platform  
**Milestone**: 2 of 5 (Customer Segmentation & RFM Modeling)  
**Status**: Completed (Submission Ready)

---

## 1. Executive Summary
Milestone 2 performs behavioral clustering to discover distinct customer groups using **RFM (Recency, Frequency, Monetary)** analytics. Using standardized feature scaling and **K-Means Clustering ($K=4$)**, the platform segments 1,000 unique retail customers into 4 actionable personas: *VIP Champions*, *New & Promising*, *At Risk / Slipping*, and *Lost Customers*. Each persona is mapped to targeted marketing and retention strategies.

---

## 2. RFM Feature Engineering

| Metric | Definition | Mathematical Formulation | Business Significance |
|---|---|---|---|
| **Recency ($R$)** | Days elapsed since the customer's last order | $T_{\text{snapshot}} - \max(T_{\text{order}})$ | Identifies engagement freshness vs inactivity |
| **Frequency ($F$)** | Total number of unique purchase transactions | $\text{count}(\text{distinct } \text{OrderID})$ | Measures customer loyalty and habit formation |
| **Monetary ($M$)** | Aggregate gross sales revenue generated | $\sum \text{Sales}$ | Measures customer lifetime value (LTV) |

Features are standardized using `StandardScaler` to ensure zero mean and unit variance across disparate measurement scales:
$$z = \frac{x - \mu}{\sigma}$$

---

## 3. Clustering Methodology & Evaluation

### 3.1 Optimal Cluster Selection ($K=4$)
Clustering quality was evaluated using both the **Silhouette Analysis** (measuring how similar an object is to its own cluster compared to other clusters) and the **Davies-Bouldin Index** (evaluating cluster separation and compactness):

| Metric | Measured Score | Ideal Direction | Interpretation |
|---|---|---|---|
| **Silhouette Score** | **0.6557** | Higher ($\to 1.0$) | Exceptional cluster separation with minimal boundary overlap |
| **Davies-Bouldin Index** | **0.4905** | Lower ($\to 0.0$) | Highly compact clusters with distinct inter-cluster distances |

---

## 4. Persona Mapping & Retention Action Plans

| Cluster Persona | Customer Count | Avg Recency | Avg Frequency | Avg Monetary | Actionable Retention Strategy |
|---|---|---|---|---|---|
| **VIP Champions** | 108 (10.8%) | ~18 days | ~22.4 orders | $14,850+ | Reward loyalty with VIP preview events, concierge perks & exclusive bundles |
| **New & Promising** | 487 (48.7%) | ~24 days | ~4.8 orders | $1,820 | Nurture onboarding with welcome discounts, cross-sell recommendations & follow-up surveys |
| **At Risk / Slipping** | 199 (19.9%) | ~82 days | ~9.2 orders | $4,350 | Send proactive re-engagement email with limited-time 15% incentive coupon |
| **Lost Customers** | 206 (20.6%) | ~215 days | ~2.1 orders | $610 | Execute win-back automated campaign; conduct exit surveys to diagnose attrition |

---

## 5. Artifacts & Serialization
- Model Artifact: `models/segmentation_kmeans.pkl`
- Scaler Artifact: `models/segmentation_scaler.pkl`
- SQLite Table: `customer_segments` (stores CustomerID, Recency, Frequency, Monetary, Cluster, Segment, ActionStrategy)
- SQLite Table: `segmentation_metrics` (stores Silhouette Score, Davies-Bouldin Index)
- MLflow Experiment: `RetailPulse_Customer_Segmentation`

---

## 6. Milestone Deliverables Checklist
- [x] RFM aggregation script (`src/segmentation.py`)
- [x] Feature scaling and normalization pipeline
- [x] K-Means clustering algorithm ($K=4$)
- [x] Quantitative evaluation (Silhouette Score: 0.6557, Davies-Bouldin: 0.4905)
- [x] Business persona mapping with retention strategies
- [x] Interactive 3D and 2D cluster visualization in dashboard
- [x] Automated unit test validation (`tests/test_models.py::test_kmeans_segmentation_artifacts`)
