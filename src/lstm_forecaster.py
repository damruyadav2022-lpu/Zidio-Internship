import os
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error, mean_absolute_error

# Set seeds for reproducibility
torch.manual_seed(42)
np.random.seed(42)

class LSTMDemandModel(nn.Module):
    """
    Deep Learning LSTM architecture for retail demand forecasting.
    """
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, output_size=1, dropout=0.2):
        super(LSTMDemandModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0
        )
        self.fc1 = nn.Linear(hidden_size, 32)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, output_size)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = out[:, -1, :] # Take last time step output
        out = self.fc1(out)
        out = self.relu(out)
        out = self.fc2(out)
        return out

def create_sequences(data, seq_length=30):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        x = data[i:(i + seq_length)]
        y = data[i + seq_length]
        xs.append(x)
        ys.append(y)
    return np.array(xs), np.array(ys)

def train_lstm_forecaster(daily_sales_df, forecast_days=30, seq_length=30, epochs=45, lr=0.005, models_dir="models"):
    """
    Trains PyTorch LSTM neural network on daily sales time series and forecasts future periods.
    """
    os.makedirs(models_dir, exist_ok=True)
    sales_values = daily_sales_df["Sales"].values.astype(float).reshape(-1, 1)
    
    # Scale data to [0, 1] range for stable gradient descent
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_sales = scaler.fit_transform(sales_values)
    
    # Train-val split (reserve last forecast_days for validation)
    train_scaled = scaled_sales[:-forecast_days]
    val_scaled = scaled_sales[-forecast_days - seq_length:]
    
    X_train, y_train = create_sequences(train_scaled, seq_length=seq_length)
    X_val, y_val = create_sequences(val_scaled, seq_length=seq_length)
    
    # Convert to PyTorch tensors
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    X_train_t = torch.tensor(X_train, dtype=torch.float32).to(device)
    y_train_t = torch.tensor(y_train, dtype=torch.float32).to(device)
    X_val_t = torch.tensor(X_val, dtype=torch.float32).to(device)
    
    model = LSTMDemandModel(input_size=1, hidden_size=64, num_layers=2, dropout=0.2).to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    
    # Training Loop
    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        outputs = model(X_train_t)
        loss = criterion(outputs, y_train_t)
        loss.backward()
        optimizer.step()
        
    # Validation Evaluation
    model.eval()
    with torch.no_grad():
        val_pred_scaled = model(X_val_t).cpu().numpy()
        
    val_pred = scaler.inverse_transform(val_pred_scaled).flatten()
    val_actual = scaler.inverse_transform(y_val).flatten()
    
    val_mape = mean_absolute_percentage_error(val_actual, val_pred)
    val_rmse = np.sqrt(mean_squared_error(val_actual, val_pred))
    val_mae = mean_absolute_error(val_actual, val_pred)
    
    print(f"PyTorch LSTM Evaluation -> MAPE: {val_mape:.4%}, RMSE: {val_rmse:.2f}, MAE: {val_mae:.2f}")
    
    # Retrain on full dataset for future forecasting
    X_full, y_full = create_sequences(scaled_sales, seq_length=seq_length)
    X_full_t = torch.tensor(X_full, dtype=torch.float32).to(device)
    y_full_t = torch.tensor(y_full, dtype=torch.float32).to(device)
    
    full_model = LSTMDemandModel(input_size=1, hidden_size=64, num_layers=2, dropout=0.2).to(device)
    full_opt = torch.optim.Adam(full_model.parameters(), lr=lr, weight_decay=1e-5)
    
    full_model.train()
    for epoch in range(epochs):
        full_opt.zero_grad()
        out = full_model(X_full_t)
        loss = criterion(out, y_full_t)
        loss.backward()
        full_opt.step()
        
    # Autoregressive multi-step future forecasting (30 days ahead)
    full_model.eval()
    curr_seq = scaled_sales[-seq_length:].copy()
    future_scaled = []
    
    for _ in range(forecast_days):
        input_t = torch.tensor(curr_seq.reshape(1, seq_length, 1), dtype=torch.float32).to(device)
        with torch.no_grad():
            next_step = full_model(input_t).cpu().numpy()[0, 0]
            future_scaled.append(next_step)
            # Roll sequence forward
            curr_seq = np.append(curr_seq[1:], [[next_step]], axis=0)
            
    future_preds = scaler.inverse_transform(np.array(future_scaled).reshape(-1, 1)).flatten()
    
    # Generate future dates
    last_date = daily_sales_df["OrderDate"].max()
    future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=forecast_days)
    
    # Build results dataframe
    df_lstm_future = pd.DataFrame({
        "ds": future_dates,
        "yhat": future_preds,
        "yhat_lower": future_preds * 0.88,
        "yhat_upper": future_preds * 1.12,
        "model_type": "PyTorch LSTM"
    })
    
    # Save model weights
    torch.save(full_model.state_dict(), os.path.join(models_dir, "lstm_demand_model.pt"))
    
    metrics = {
        "MAPE": float(val_mape),
        "RMSE": float(val_rmse),
        "MAE": float(val_mae),
        "Model": "PyTorch LSTM"
    }
    
    return df_lstm_future, metrics
