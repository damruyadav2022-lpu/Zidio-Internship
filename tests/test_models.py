import os
import pickle
import sqlite3
import pytest
import numpy as np
import pandas as pd
import torch
from src.lstm_forecaster import LSTMDemandModel

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "retailpulse.db")

def test_kmeans_segmentation_artifacts():
    kmeans_path = os.path.join(MODELS_DIR, "segmentation_kmeans.pkl")
    scaler_path = os.path.join(MODELS_DIR, "segmentation_scaler.pkl")
    
    assert os.path.exists(kmeans_path), "K-Means model pickle not found"
    assert os.path.exists(scaler_path), "Scaler pickle not found"
    
    with open(kmeans_path, "rb") as f:
        kmeans = pickle.load(f)
    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)
        
    assert kmeans.n_clusters == 4, "Expected 4 clusters for customer segmentation"
    dummy_input = np.array([[30, 5, 500.0]])
    scaled = scaler.transform(dummy_input)
    cluster = kmeans.predict(scaled)
    assert cluster[0] in [0, 1, 2, 3]

def test_churn_classifier_artifacts():
    model_path = os.path.join(MODELS_DIR, "churn_rf_model.pkl")
    features_path = os.path.join(MODELS_DIR, "churn_features.pkl")
    
    assert os.path.exists(model_path), "Churn model pickle not found"
    assert os.path.exists(features_path), "Churn features pickle not found"
    
    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(features_path, "rb") as f:
        features = pickle.load(f)
        
    # Verify leak-free feature set (Recency must NOT be in features)
    assert "Recency" not in features, "Data leakage detected: Recency found in training features"
    assert "LastPurchase" not in features, "Data leakage detected: LastPurchase found in features"
    
    # Test inference output
    dummy_data = pd.DataFrame([{f: 1.0 for f in features}])
    prob = model.predict_proba(dummy_data)[:, 1][0]
    assert 0.0 <= prob <= 1.0, f"Predicted churn probability out of bounds: {prob}"

def test_pytorch_lstm_forecaster_weights():
    lstm_path = os.path.join(MODELS_DIR, "lstm_demand_model.pt")
    assert os.path.exists(lstm_path), "PyTorch LSTM model weights not found"
    
    model = LSTMDemandModel(input_size=1, hidden_size=64, num_layers=2, dropout=0.2)
    state_dict = torch.load(lstm_path, map_location=torch.device('cpu'), weights_only=True)
    model.load_state_dict(state_dict)
    model.eval()
    
    # Test forward pass with 30-day sequence tensor: shape [batch_size=1, seq_length=30, input_dim=1]
    dummy_seq = torch.randn(1, 30, 1)
    with torch.no_grad():
        output = model(dummy_seq)
        
    assert output.shape == (1, 1), f"Unexpected output shape: {output.shape}"
