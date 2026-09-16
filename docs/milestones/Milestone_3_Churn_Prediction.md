# Milestone 3: Predictive Customer Churn Analytics

**Project**: RetailPulse – AI-Powered Customer Analytics & Demand Forecasting Platform  
**Milestone**: 3 of 5 (Customer Churn Modeling & Risk Scoring)  
**Status**: Completed (Submission Ready)

---

## 1. Executive Summary
Milestone 3 implements a predictive churn risk classification system. Customer churn is defined as **inactivity exceeding 90 days**. To ensure realistic generalization in live operations, the feature pipeline incorporates **strict anti-data-leakage protocols** (excluding `Recency` and `LastPurchase` from predictor inputs). The platform benchmarks **Random Forest** against **XGBoost Classifier**, with XGBoost achieving champion performance (**ROC-AUC = 0.9615**). Churn probability scores and prioritized intervention alerts are generated for all active customer accounts.

---

## 2. Anti-Data-Leakage Feature Engineering

In many naive churn implementations, models achieve falsely inflated accuracy because `Recency` (days since last purchase) is used as a predictor when `Recency > 90` was used to define churn itself. 

**RetailPulse strictly eliminates this leakage** by training solely on behavioral, velocity, and basket-level features:

| Feature Name | Description | Formula / Source | Leak-Free Rationale |
|---|---|---|---|
| `Frequency` | Total lifetime order count | $\text{count}(\text{OrderID})$ | Captures historical engagement volume |
| `Monetary` | Total lifetime expenditure | $\sum \text{Sales}$ | Captures account value |
| `PurchaseInterval` | Mean inter-order gap (days) | $\text{mean}(\Delta t_{\text{orders}})$ | Velocity metric independent of snapshot date |
| `AOV` | Average Order Value | $\text{Monetary} / \text{Frequency}$ | Identifies basket spending magnitude |
| `ProfitMargin` | Net profit efficiency ratio | $\text{TotalProfit} / \text{Monetary}$ | Indicates product margin mix |
| `AvgQuantityPerOrder` | Units purchased per transaction | $\text{TotalQty} / \text{Frequency}$ | Measures bulk vs single purchasing habit |
| `AvgDiscount` | Average promotional discount applied | $\text{mean}(\text{Discount})$ | Measures discount sensitivity |
| `SpendingTrend` | Spending in 2nd half vs 1st half of account lifetime | $\frac{\text{Sales}_{2nd} + 1}{\text{Sales}_{1st} + 1}$ | Directly detects spending acceleration or deceleration |

---

## 3. Model Training & Benchmark Comparison

The dataset was split using stratified sampling (75% train / 25% validation, maintaining class balance). Both models were evaluated across standard classification metrics:

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Production Status |
|---|---|---|---|---|---|---|
| **Random Forest Classifier** | 86.00% | 85.71% | 62.50% | 0.7200 | 0.9475 | Baseline / Staged |
| **XGBoost Classifier** | **90.40%** | **85.29%** | **81.45%** | **0.8333** | **0.9615** | **🏆 Champion Model Deployed** |

### Key Benchmark Takeaways:
- **XGBoost** achieved a superior **ROC-AUC of 0.9615** and increased **Recall to 81.45%** (a 19% improvement over Random Forest in identifying churners before they leave).
- F1-Score improved from 0.7200 to **0.8333**, providing balanced precision and recall.

---

## 4. Feature Importance Rankings

The champion model's feature importance analysis reveals the primary behavioral drivers of retail churn:

1. **`SpendingTrend` (38.4%)**: Declining spending between customer lifecycle halves is the single most predictive indicator of imminent attrition.
2. **`PurchaseInterval` (24.1%)**: Lengthening intervals between successive orders signals customer disengagement.
3. **`Frequency` (15.2%)**: Customers with single or double purchases have higher baseline churn vulnerability.
4. **`AOV` & `Monetary` (12.3%)**: Fluctuations in typical order size.
5. **`AvgDiscount` & `ProfitMargin` (10.0%)**: Price sensitivity patterns.

---

## 5. Active Customer Churn Risk Scoring & Automated Alerts

Predictions were generated across all active accounts ($\text{Churn} = 0$), categorizing risk tiers:
- **High Risk ($\ge 70\%$)**: Imminent loss; requires automated high-priority intervention.
- **Medium Risk ($40\% - 69\%$)**: Slowing activity; targeted cross-sell and engagement.
- **Low Risk ($< 40\%$)**: Healthy engagement; standard communications.

High-risk customers are stored in SQLite table `churn_high_risk_alerts` with recommended actions:
- **VIP Champions in High Risk**: *"High-Priority Account Manager Outreach & Loyalty Bonus"*
- **High-Spend ($>\$1,000$) in High Risk**: *"15% Exclusive Discount Voucher via SMS/Email"*
- **Standard Accounts in High Risk**: *"Targeted Re-Engagement Campaign with Free Shipping"*

---

## 6. Artifacts & MLOps Tracking
- Champion Model Artifact: `models/churn_rf_model.pkl` (XGBoost Classifier)
- Feature Registry: `models/churn_features.pkl`
- SQLite Table: `churn_predictions`
- SQLite Table: `churn_model_comparison`
- SQLite Table: `churn_high_risk_alerts`
- MLflow Tracking: Logged runs under `RetailPulse_Churn_Prediction`

---

## 7. Milestone Deliverables Checklist
- [x] Churn target formulation (90-day inactivity threshold)
- [x] Zero-leakage behavioral feature engineering
- [x] Model benchmarking: Random Forest vs XGBoost
- [x] Metric validation: ROC-AUC = 0.9615, Accuracy = 90.40%, F1 = 0.8333
- [x] Feature importance visualization in Streamlit dashboard
- [x] Individual customer risk profiler tool
- [x] One-click CSV export of high-risk retention candidates
- [x] Automated unit test validation (`tests/test_models.py::test_churn_classifier_artifacts`)
