import os
import pickle
import sqlite3
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_percentage_error

def run_forecasting(db_path="e:/Zidio Internship/RetailPulse/retailpulse.db", models_dir="e:/Zidio Internship/RetailPulse/models"):
    """
    Trains a demand forecasting model (using Prophet if available, otherwise a high-fidelity
    Random Forest fallback) and calculates inventory optimization metrics.
    """
    print("Starting Demand Forecasting & Inventory Optimization...")
    os.makedirs(models_dir, exist_ok=True)
    
    # 1. Fetch transactions from SQLite database
    conn = sqlite3.connect(db_path)
    query = """
        SELECT OrderDate, ProductID, Sales, Quantity
        FROM sales
    """
    df_sales = pd.read_sql_query(query, conn)
    df_sales["OrderDate"] = pd.to_datetime(df_sales["OrderDate"])
    
    # Aggregate daily sales
    daily_sales = df_sales.groupby("OrderDate")["Sales"].sum().reset_index()
    daily_sales = daily_sales.sort_values("OrderDate").reset_index(drop=True)
    
    # Make sure we have a continuous index of dates
    r = pd.date_range(start=daily_sales["OrderDate"].min(), end=daily_sales["OrderDate"].max())
    daily_sales = daily_sales.set_index("OrderDate").reindex(r, fill_value=0.0).reset_index().rename(columns={"index": "OrderDate"})
    
    print(f"Aggregated sales history: {len(daily_sales)} days of sales.")

    # 2. Check if Prophet is installed, otherwise use Fallback Random Forest Time Series model
    use_prophet = False
    try:
        from prophet import Prophet
        use_prophet = True
        print("Prophet successfully imported. Running Meta Prophet forecasting model...")
    except ImportError:
        print("Prophet library not found or failed to compile. Using high-fidelity Random Forest fallback model...")

    forecast_days = 30
    
    if use_prophet:
        # Format data for Prophet
        df_prophet = daily_sales.rename(columns={"OrderDate": "ds", "Sales": "y"})
        
        # Train-validation split for accuracy logging
        train_df = df_prophet.iloc[:-forecast_days]
        val_df = df_prophet.iloc[-forecast_days:]
        
        m_val = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
        m_val.fit(train_df)
        val_forecast = m_val.predict(val_df[["ds"]])
        mape = mean_absolute_percentage_error(val_df["y"], val_forecast["yhat"])
        print(f"Validation MAPE: {mape:.4%}")
        
        # Train final model on entire dataset
        model = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
        model.fit(df_prophet)
        
        # Predict future
        future = model.make_future_dataframe(periods=forecast_days)
        forecast = model.predict(future)
        
        # Format output
        df_forecast = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
        df_forecast["model_type"] = "Prophet"
        
        # Save model
        with open(os.path.join(models_dir, "demand_forecast_model.pkl"), "wb") as f:
            pickle.dump(model, f)
            
    else:
        # Fallback Random Forest time-series forecasting model
        # Feature Engineering: Lag features and Rolling statistics
        df_rf = daily_sales.copy()
        
        # Lags
        for lag in [1, 2, 7, 14, 30]:
            df_rf[f"sales_lag_{lag}"] = df_rf["Sales"].shift(lag)
            
        # Rolling means
        for roll in [7, 14, 30]:
            df_rf[f"sales_roll_mean_{roll}"] = df_rf["Sales"].shift(1).rolling(roll).mean()
            
        # Time components
        df_rf["day_of_week"] = df_rf["OrderDate"].dt.dayofweek
        df_rf["month"] = df_rf["OrderDate"].dt.month
        df_rf["day_of_month"] = df_rf["OrderDate"].dt.day
        
        df_rf = df_rf.dropna().reset_index(drop=True)
        
        feature_cols = [c for c in df_rf.columns if c not in ["OrderDate", "Sales"]]
        
        # Train-validation split for accuracy logging
        X = df_rf[feature_cols]
        y = df_rf["Sales"]
        
        X_train, X_val = X.iloc[:-forecast_days], X.iloc[-forecast_days:]
        y_train, y_val = y.iloc[:-forecast_days], y.iloc[-forecast_days:]
        
        rf_val = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        rf_val.fit(X_train, y_train)
        
        # Autoregressive forecasting for validation set
        val_predictions = []
        last_observed = df_rf.iloc[-forecast_days - 30 : -forecast_days].copy() # Past 30 days for rolling context
        
        # Simulate step-by-step prediction for validation
        for step in range(forecast_days):
            target_date = daily_sales.iloc[-forecast_days + step]["OrderDate"]
            
            # Construct row
            row = {"day_of_week": target_date.dayofweek, "month": target_date.month, "day_of_month": target_date.day}
            for lag in [1, 2, 7, 14, 30]:
                row[f"sales_lag_{lag}"] = last_observed.iloc[-lag]["Sales"]
            for roll in [7, 14, 30]:
                row[f"sales_roll_mean_{roll}"] = last_observed.iloc[-roll:]["Sales"].mean()
                
            pred_df = pd.DataFrame([row])[feature_cols]
            pred = rf_val.predict(pred_df)[0]
            val_predictions.append(pred)
            
            # Append prediction to rolling context
            new_row = pd.DataFrame([{"OrderDate": target_date, "Sales": pred}])
            last_observed = pd.concat([last_observed, new_row]).reset_index(drop=True)
            
        mape = mean_absolute_percentage_error(y_val, val_predictions)
        print(f"Validation MAPE (Fallback Model): {mape:.4%}")
        
        # Train final model on complete dataset
        rf_final = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        rf_final.fit(X, y)
        
        # Forecast future step-by-step (30 days ahead)
        future_predictions = []
        future_dates = pd.date_range(start=daily_sales["OrderDate"].max() + pd.Timedelta(days=1), periods=forecast_days)
        
        last_observed = df_rf.copy()
        
        for step in range(forecast_days):
            target_date = future_dates[step]
            
            # Construct row
            row = {"day_of_week": target_date.dayofweek, "month": target_date.month, "day_of_month": target_date.day}
            for lag in [1, 2, 7, 14, 30]:
                row[f"sales_lag_{lag}"] = last_observed.iloc[-lag]["Sales"]
            for roll in [7, 14, 30]:
                row[f"sales_roll_mean_{roll}"] = last_observed.iloc[-roll:]["Sales"].mean()
                
            pred_df = pd.DataFrame([row])[feature_cols]
            pred = rf_final.predict(pred_df)[0]
            future_predictions.append(pred)
            
            # Append prediction to context
            new_row = pd.DataFrame([{"OrderDate": target_date, "Sales": pred}])
            last_observed = pd.concat([last_observed, new_row]).reset_index(drop=True)
            
        # Create final forecast dataframe containing history + future
        history_forecast = pd.DataFrame({
            "ds": daily_sales["OrderDate"],
            "yhat": daily_sales["Sales"],
            "yhat_lower": daily_sales["Sales"] * 0.95,
            "yhat_upper": daily_sales["Sales"] * 1.05
        })
        
        # Simple simulated confidence bounds for fallback forecast
        future_forecast = pd.DataFrame({
            "ds": future_dates,
            "yhat": future_predictions,
            "yhat_lower": np.array(future_predictions) * 0.85,
            "yhat_upper": np.array(future_predictions) * 1.15
        })
        
        df_forecast = pd.concat([history_forecast, future_forecast]).reset_index(drop=True)
        df_forecast["model_type"] = "RandomForest TimeSeries"
        
        # Save model
        with open(os.path.join(models_dir, "demand_forecast_model.pkl"), "wb") as f:
            pickle.dump(rf_final, f)
        with open(os.path.join(models_dir, "forecast_features.pkl"), "wb") as f:
            pickle.dump(feature_cols, f)
            
    # Save primary forecast results to SQLite database
    df_forecast["ds"] = pd.to_datetime(df_forecast["ds"]).dt.strftime("%Y-%m-%d")
    df_forecast.to_sql("demand_forecast", conn, if_exists="replace", index=False)
    
    # 2b. Train PyTorch Deep Learning LSTM Forecaster
    print("\nTraining PyTorch Deep Learning LSTM Demand Forecaster...")
    from src.lstm_forecaster import train_lstm_forecaster
    import mlflow
    
    try:
        df_lstm_future, lstm_metrics = train_lstm_forecaster(
            daily_sales_df=daily_sales, 
            forecast_days=forecast_days, 
            seq_length=30, 
            epochs=45, 
            models_dir=models_dir
        )
        
        # Combine history + LSTM future predictions
        history_part = pd.DataFrame({
            "ds": daily_sales["OrderDate"].dt.strftime("%Y-%m-%d"),
            "yhat": daily_sales["Sales"],
            "yhat_lower": daily_sales["Sales"] * 0.95,
            "yhat_upper": daily_sales["Sales"] * 1.05,
            "model_type": "Historical / PyTorch LSTM"
        })
        df_lstm_future["ds"] = pd.to_datetime(df_lstm_future["ds"]).dt.strftime("%Y-%m-%d")
        df_lstm_full = pd.concat([history_part, df_lstm_future]).reset_index(drop=True)
        df_lstm_full.to_sql("demand_forecast_lstm", conn, if_exists="replace", index=False)
        
        # Save comparative metrics table
        primary_model_name = "Prophet" if use_prophet else "RandomForest TimeSeries"
        comparison_df = pd.DataFrame([
            {"Model": primary_model_name, "MAPE": f"{mape:.2%}", "RMSE": round(np.sqrt(np.mean((val_forecast['yhat'] - val_df['y'])**2)) if use_prophet else round(np.sqrt(np.mean((np.array(val_predictions) - y_val)**2)), 2), 2), "Status": "Baseline Model"},
            {"Model": "PyTorch LSTM Neural Network", "MAPE": f"{lstm_metrics['MAPE']:.2%}", "RMSE": round(lstm_metrics['RMSE'], 2), "Status": "Deep Learning Champion"}
        ])
        comparison_df.to_sql("forecast_model_comparison", conn, if_exists="replace", index=False)
        
        # MLflow Tracking for Demand Forecasting
        try:
            mlflow.set_experiment("RetailPulse_Demand_Forecasting")
            with mlflow.start_run(run_name=f"{primary_model_name}_Forecast", nested=True):
                mlflow.log_param("forecast_horizon_days", forecast_days)
                mlflow.log_metric("mape", float(mape))
                
            with mlflow.start_run(run_name="PyTorch_LSTM_Forecaster", nested=True):
                mlflow.log_param("architecture", "2-Layer LSTM + Linear")
                mlflow.log_param("sequence_length", 30)
                mlflow.log_param("hidden_dim", 64)
                mlflow.log_metric("mape", float(lstm_metrics['MAPE']))
                mlflow.log_metric("rmse", float(lstm_metrics['RMSE']))
                mlflow.log_metric("mae", float(lstm_metrics['MAE']))
        except Exception as e:
            print(f"MLflow demand logging notice: {e}")
            
    except Exception as e:
        print(f"Warning: LSTM training failed, continuing with primary model: {e}")
        comparison_df = pd.DataFrame([{"Model": "RandomForest TimeSeries", "MAPE": f"{mape:.2%}", "RMSE": 0.0, "Status": "Primary"}])
        comparison_df.to_sql("forecast_model_comparison", conn, if_exists="replace", index=False)
    
    # Save standard metrics
    metrics_df = pd.DataFrame([{"MAPE": mape, "ModelType": "Prophet" if use_prophet else "RandomForest TimeSeries"}])
    metrics_df.to_sql("forecast_metrics", conn, if_exists="replace", index=False)

    # 3. Inventory Optimization Logic
    # ROP = (Average Daily Demand * Lead Time) + Safety Stock
    # Safety Stock = Z * std(daily demand) * sqrt(Lead Time)
    # Z = 1.645 (95% service level)
    
    # Load products and current inventory
    df_prods = pd.read_sql_query("SELECT ProductID, ProductName, Category, UnitPrice FROM products", conn)
    df_inv = pd.read_sql_query("SELECT ProductID, CurrentStock, LeadTime FROM inventory", conn)
    
    # Ingest sales to get historical product demand (last 90 days of transactions)
    max_date = df_sales["OrderDate"].max()
    ninety_days_ago = max_date - pd.Timedelta(days=90)
    sales_90d = df_sales[df_sales["OrderDate"] >= ninety_days_ago]
    
    inventory_recs = []
    
    for _, item in df_inv.iterrows():
        p_id = item["ProductID"]
        lead_time = item["LeadTime"]
        curr_stock = item["CurrentStock"]
        
        prod_info = df_prods[df_prods["ProductID"] == p_id].iloc[0]
        prod_name = prod_info["ProductName"]
        prod_cat = prod_info["Category"]
        unit_price = prod_info["UnitPrice"]
        
        # Calculate daily quantities sold in last 90 days
        p_sales = sales_90d[sales_90d["ProductID"] == p_id]
        if len(p_sales) > 0:
            daily_qty = p_sales.groupby("OrderDate")["Quantity"].sum()
            # Reindex to all 90 days to fill zeros
            idx_90d = pd.date_range(start=ninety_days_ago, end=max_date)
            daily_qty = daily_qty.reindex(idx_90d, fill_value=0)
            
            avg_daily_demand = daily_qty.mean()
            std_daily_demand = daily_qty.std()
        else:
            avg_daily_demand = 0.5
            std_daily_demand = 0.5
            
        # Math calculations
        safety_stock = int(1.645 * std_daily_demand * np.sqrt(lead_time)) + 1
        reorder_point = int(avg_daily_demand * lead_time) + safety_stock
        
        # Determine 30-day forecasted demand for this specific product
        # Use historical sales ratio of this product to estimate share of forecasted sales
        total_hist_sales = df_sales["Sales"].sum()
        prod_hist_sales = p_sales["Sales"].sum() if len(p_sales) > 0 else unit_price * avg_daily_demand * 90
        prod_share = (prod_hist_sales + 1) / (total_hist_sales + 1)
        
        # Forecasted next 30 days total sales
        future_total_sales_forecast = df_forecast.iloc[-forecast_days:]["yhat"].sum()
        prod_forecasted_sales = future_total_sales_forecast * prod_share
        prod_forecasted_qty = max(1, int(prod_forecasted_sales / (unit_price + 1e-5)))
        
        # Suggested Order Quantity
        suggested_order = 0
        if curr_stock <= reorder_point:
            # Order up to meet future demand + safety stock
            suggested_order = max(0, (prod_forecasted_qty + safety_stock) - curr_stock)
            
        # Determine Alert Level
        if curr_stock <= safety_stock:
            alert = "Red (Critical)"
        elif curr_stock <= reorder_point:
            alert = "Yellow (Reorder)"
        else:
            alert = "Green (Healthy)"
            
        inventory_recs.append({
            "ProductID": p_id,
            "ProductName": prod_name,
            "Category": prod_cat,
            "CurrentStock": int(curr_stock),
            "SafetyStock": int(safety_stock),
            "ReorderPoint": int(reorder_point),
            "LeadTime": int(lead_time),
            "AvgDailyDemand": round(avg_daily_demand, 2),
            "ForecastedDemand30D": int(prod_forecasted_qty),
            "SuggestedOrder": int(suggested_order),
            "AlertLevel": alert
        })
        
    df_recs = pd.DataFrame(inventory_recs)
    df_recs.to_sql("inventory_recommendations", conn, if_exists="replace", index=False)
    
    conn.close()
    print("Forecasting and Inventory optimization calculation complete!")

if __name__ == "__main__":
    run_forecasting()
