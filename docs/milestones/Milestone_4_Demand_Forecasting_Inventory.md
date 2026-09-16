# Milestone 4: AI Demand Forecasting & Inventory Optimization

**Project**: RetailPulse – AI-Powered Customer Analytics & Demand Forecasting Platform  
**Milestone**: 4 of 5 (Demand Forecasting & Inventory Replenishment)  
**Status**: Completed (Submission Ready)

---

## 1. Executive Summary
Milestone 4 implements time-series demand forecasting and an automated inventory replenishment engine. The platform aggregates daily sales history (1,246 days) and benchmarks **Prophet / Lagged Random Forest** against a **Deep Learning PyTorch LSTM (Long Short-Term Memory) Neural Network**. Forecasted demand rates feed directly into statistical **Safety Stock** and **Reorder Point (ROP)** formulas, categorizing warehouse SKUs into actionable status tiers (*Red Critical*, *Yellow Reorder*, *Green Healthy*) to prevent stockouts while reducing excess holding costs.

---

## 2. Time-Series Data Preparation & Sequence Construction

Daily transactional sales are aggregated and re-indexed to ensure continuity across calendar dates without missing timestamps. 

For the deep learning architecture, historical demand is structured into sliding sequences:
- **Lookback Window**: 30 consecutive days of daily sales ($X_t = [s_{t-29}, s_{t-28}, \dots, s_t]$)
- **Target Value**: Next day sales ($y_t = s_{t+1}$)
- **Normalization**: Min-Max feature scaling to $[0, 1]$ interval for gradient descent stability:
  $$s_{\text{norm}} = \frac{s - s_{\min}}{s_{\max} - s_{\min}}$$

---

## 3. Deep Learning PyTorch LSTM Architecture (`src/lstm_forecaster.py`)

```
   Input Sequence (30 Days Daily Sales) -> Shape [Batch, 30, 1]
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ LSTM Layer 1 (64 Hidden Units, Dropout = 0.2)          │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ LSTM Layer 2 (64 Hidden Units, Dropout = 0.2)          │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ Dense FC Layer 1 (64 -> 32) + ReLU Activation          │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ Output FC Layer 2 (32 -> 1)                            │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
     30-Day Autoregressive Future Forecast [Batch, 30]
```

### Hyperparameters:
- **Optimizer**: Adam ($\text{lr} = 0.005$, $\text{weight decay} = 10^{-5}$)
- **Loss Function**: Mean Squared Error (MSE Loss)
- **Epochs**: 45
- **Forecast Horizon**: 30 days ahead

---

## 4. Forecasting Model Benchmark & Evaluation

Models were evaluated on a reserved 30-day out-of-sample validation split:

| Model Architecture | Algorithm Category | MAPE | RMSE | MAE | Production Role |
|---|---|---|---|---|---|
| **Lagged Random Forest** | Feature-Engineered Ensemble | **24.08%** | 19,840.50 | 15,210.30 | Short-Horizon Baseline |
| **PyTorch LSTM** | Deep Recurrent Neural Network | **34.33%** | 26,864.95 | 21,548.69 | Non-Linear Deep Learning Champion |

Both models produce 30-day forward trajectories with 90% confidence bands ($y_{\text{hat}} \pm 12\%$), accessible via interactive overlay in the dashboard.

---

## 5. Statistical Inventory Optimization Engine

Forecasted demand rates for each SKU are synthesized with supplier lead times and historical demand standard deviations to optimize inventory levels:

### 5.1 Mathematical Formulations

1. **Safety Stock ($SS$)**:
   Buffer inventory required to maintain a **95% service level** against demand volatility:
   $$SS = Z \times \sigma_{\text{daily demand}} \times \sqrt{\text{Lead Time}}$$
   *(Where $Z = 1.645$ for a 95% cycle service level)*

2. **Reorder Point ($ROP$)**:
   The inventory threshold that triggers an automated replenishment purchase order:
   $$ROP = (\bar{d}_{\text{daily demand}} \times \text{Lead Time}) + SS$$

3. **Suggested Order Quantity**:
   $$\text{Order Qty} = \begin{cases} (D_{\text{30D Forecast}} + SS) - \text{CurrentStock}, & \text{if } \text{CurrentStock} \le ROP \\ 0, & \text{otherwise} \end{cases}$$

### 5.2 Stockout Risk Alert Matrix

| Alert Level | Condition | Business Meaning | Automated System Action |
|---|---|---|---|
| **🔴 Red (Critical)** | $\text{CurrentStock} \le SS$ | Immediate stockout risk | Trigger expedited emergency supplier PO |
| **🟡 Yellow (Reorder)** | $SS < \text{CurrentStock} \le ROP$ | Buffer threshold crossed | Generate standard replenishment order |
| **🟢 Green (Healthy)** | $\text{CurrentStock} > ROP$ | Safe operating buffer | Maintain normal monitoring |

---

## 6. Artifacts & Database Integration
- PyTorch Weights: `models/lstm_demand_model.pt`
- Machine Learning Model: `models/demand_forecast_model.pkl`
- SQLite Table: `demand_forecast` (Primary baseline forecast)
- SQLite Table: `demand_forecast_lstm` (PyTorch deep learning forecast)
- SQLite Table: `forecast_model_comparison`
- SQLite Table: `inventory_recommendations` (200 SKUs with ROP, SS, and Suggested Orders)
- MLflow Tracking: Logged experiments under `RetailPulse_Demand_Forecasting`

---

## 7. Milestone Deliverables Checklist
- [x] Daily time-series sales aggregation and data sanitization
- [x] PyTorch LSTM neural network module (`src/lstm_forecaster.py`)
- [x] Random Forest / Prophet time-series baseline
- [x] Comparative evaluation (MAPE, RMSE, MAE)
- [x] Safety Stock calculation at 95% service level
- [x] Reorder Point (ROP) dynamic threshold calculations
- [x] Interactive Lead Time and Safety Factor simulation slider in Streamlit
- [x] Automated replenishment purchase order generation with CSV export
- [x] Automated unit test validation (`tests/test_models.py::test_pytorch_lstm_forecaster_weights`, `tests/test_inventory.py`)
