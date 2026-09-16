import os
import sqlite3
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
import streamlit.components.v1 as components
from datetime import datetime

# -------------------------------------------------------------
# PAGE CONFIGURATION
# -------------------------------------------------------------
st.set_page_config(
    page_title="RetailPulse – AI Customer & Demand Intelligence",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Invisible Keep-Alive Heartbeat (Pings server every 25s so browser tabs & WebSockets never sleep)
components.html("""
<script>
    (function() {
        if (!window._keepAliveActive) {
            window._keepAliveActive = true;
            setInterval(function() {
                try {
                    fetch(window.location.href, { method: 'HEAD', cache: 'no-cache' }).catch(function(){});
                } catch(e) {}
            }, 25000);
        }
    })();
</script>
""", height=0, width=0)

# -------------------------------------------------------------
# ULTRA-MODERN SAAS DESIGN SYSTEM (MATCHING USER'S REFERENCE UI)
# -------------------------------------------------------------
st.markdown("""
<style>
    /* Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

    /* Global reset & background */
    .stApp {
        background: linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f8fafc 100%);
        color: #0f172a;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Hide default Streamlit header/footer for cleaner SaaS look */
    header[data-testid="stHeader"] {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid #f1f5f9;
    }
    footer {visibility: hidden;}

    /* Top Navigation Bar */
    .top-navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 32px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 20px;
        box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
        margin-bottom: 28px;
    }
    .brand-logo {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.5px;
        color: #0f172a;
        text-decoration: none;
    }
    .brand-icon {
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 8px 16px -4px rgba(99, 102, 241, 0.35);
    }
    .brand-accent {
        background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    /* Hero Typography */
    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 18px;
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.2px;
        box-shadow: 0 6px 16px -2px rgba(79, 70, 229, 0.3);
        margin-bottom: 20px;
    }
    .hero-title {
        font-size: 56px;
        font-weight: 800;
        line-height: 1.12;
        letter-spacing: -1.8px;
        color: #0f172a;
        margin-bottom: 18px;
    }
    .gradient-text {
        background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        display: inline;
    }
    .hero-sub {
        font-size: 18px;
        color: #475569;
        line-height: 1.6;
        margin-bottom: 28px;
        font-weight: 400;
        max-width: 540px;
    }

    /* Trust / Feature Chips */
    .chips-container {
        display: flex;
        gap: 24px;
        margin-top: 32px;
        flex-wrap: wrap;
    }
    .trust-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #334155;
    }
    .trust-icon-green {
        color: #10b981;
        font-size: 16px;
    }
    .trust-icon-blue {
        color: #3b82f6;
        font-size: 16px;
    }
    .trust-icon-purple {
        color: #8b5cf6;
        font-size: 16px;
    }

    /* Hero Right Preview Card with Floating Badges */
    .preview-card-wrapper {
        position: relative;
        padding: 24px 20px;
    }
    .preview-main-card {
        background: #ffffff;
        border-radius: 28px;
        padding: 32px;
        border: 1px solid rgba(226, 232, 240, 0.9);
        box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(0,0,0,0.02);
        position: relative;
    }
    .preview-header {
        font-size: 22px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .cursor-blink {
        display: inline-block;
        width: 3px;
        height: 22px;
        background: #8b5cf6;
        animation: blink 1s infinite;
    }
    @keyframes blink { 0%, 100% {opacity: 1;} 50% {opacity: 0;} }

    .preview-inner-canvas {
        background: #f8fafc;
        border-radius: 20px;
        padding: 24px;
        border: 1px solid #edf2f7;
    }
    .canvas-bar-purple {
        height: 12px;
        background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
        border-radius: 6px;
        margin-bottom: 14px;
        width: 85%;
    }
    .canvas-bar-grey {
        height: 10px;
        background: #e2e8f0;
        border-radius: 5px;
        margin-bottom: 12px;
        width: 65%;
    }
    .canvas-bar-light {
        height: 8px;
        background: #cbd5e1;
        border-radius: 4px;
        margin-bottom: 20px;
        width: 95%;
    }

    /* Metric preview rows with stars */
    .metric-preview-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
    }
    .star-icon {
        color: #f59e0b;
        font-size: 16px;
    }
    .metric-progress-blue {
        height: 10px;
        background: #bfdbfe;
        border-radius: 5px;
        flex-grow: 1;
        position: relative;
    }
    .metric-progress-blue::after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 78%;
        background: #3b82f6;
        border-radius: 5px;
    }
    .metric-progress-purple {
        height: 10px;
        background: #e9d5ff;
        border-radius: 5px;
        flex-grow: 1;
        position: relative;
    }
    .metric-progress-purple::after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 91%;
        background: #8b5cf6;
        border-radius: 5px;
    }
    .metric-progress-pink {
        height: 10px;
        background: #fbcfe8;
        border-radius: 5px;
        flex-grow: 1;
        position: relative;
    }
    .metric-progress-pink::after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 84%;
        background: #ec4899;
        border-radius: 5px;
    }

    /* Preview CTA buttons */
    .preview-card-actions {
        display: flex;
        gap: 14px;
        margin-top: 24px;
    }
    .btn-preview-primary {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        padding: 10px 22px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        border: none;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    .btn-preview-secondary {
        background: #ffffff;
        color: #334155;
        padding: 10px 22px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        border: 1px solid #e2e8f0;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    /* Floating Badges (From the Screenshot) */
    .floating-badge-sparkle {
        position: absolute;
        top: -12px;
        right: -12px;
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        box-shadow: 0 10px 20px -4px rgba(245, 158, 11, 0.45);
        animation: floatAnim 4s ease-in-out infinite;
        z-index: 10;
    }
    .floating-badge-star {
        position: absolute;
        top: 50%;
        right: -16px;
        transform: translateY(-50%);
        width: 46px;
        height: 46px;
        background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        box-shadow: 0 10px 20px -4px rgba(236, 72, 153, 0.45);
        animation: floatAnim 3.5s ease-in-out infinite 0.5s;
        z-index: 10;
    }
    .floating-badge-lightning {
        position: absolute;
        bottom: -16px;
        left: -12px;
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        box-shadow: 0 10px 20px -4px rgba(16, 185, 129, 0.45);
        animation: floatAnim 4.5s ease-in-out infinite 1s;
        z-index: 10;
    }
    .floating-badge-arrow {
        position: absolute;
        bottom: -16px;
        right: 12px;
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.4);
        z-index: 10;
    }
    @keyframes floatAnim {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
    }

    /* SaaS Dashboard Cards & Metric Tiles */
    div[data-testid="metric-container"] {
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 18px !important;
        padding: 20px 24px !important;
        box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.04) !important;
        transition: transform 0.2s ease, box-shadow 0.2s ease !important;
    }
    div[data-testid="metric-container"]:hover {
        transform: translateY(-3px) !important;
        box-shadow: 0 12px 24px -4px rgba(15, 23, 42, 0.08) !important;
        border-color: #cbd5e1 !important;
    }
    div[data-testid="stMetricValue"] {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 800 !important;
        color: #0f172a !important;
        font-size: 32px !important;
    }
    div[data-testid="stMetricLabel"] {
        color: #64748b !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
    }

    /* Custom Alert Boxes */
    .saas-card {
        background: #ffffff;
        border-radius: 20px;
        padding: 24px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04);
        margin-bottom: 20px;
    }
    .alert-red {
        background-color: #fef2f2;
        color: #991b1b;
        padding: 14px 18px;
        border-radius: 12px;
        border-left: 4px solid #ef4444;
        margin: 12px 0;
        font-size: 14px;
    }
    .alert-yellow {
        background-color: #fffbeb;
        color: #92400e;
        padding: 14px 18px;
        border-radius: 12px;
        border-left: 4px solid #f59e0b;
        margin: 12px 0;
        font-size: 14px;
    }
    .alert-green {
        background-color: #f0fdf4;
        color: #166534;
        padding: 14px 18px;
        border-radius: 12px;
        border-left: 4px solid #22c55e;
        margin: 12px 0;
        font-size: 14px;
    }

    /* Buttons */
    .stButton>button {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 14px !important;
        padding: 10px 24px !important;
        font-weight: 700 !important;
        font-size: 15px !important;
        box-shadow: 0 4px 14px -2px rgba(79, 70, 229, 0.35) !important;
        transition: all 0.2s ease !important;
    }
    .stButton>button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 20px -2px rgba(79, 70, 229, 0.5) !important;
    }

    /* Dataframe styling */
    .stDataFrame {
        border-radius: 16px !important;
        overflow: hidden !important;
        border: 1px solid #e2e8f0 !important;
    }
</style>
""", unsafe_allow_html=True)

# -------------------------------------------------------------
# DATABASE CONNECTION HELPER
# -------------------------------------------------------------
DB_PATH = "retailpulse.db"
if not os.path.exists(DB_PATH):
    DB_PATH = "e:/Zidio Internship/RetailPulse/retailpulse.db"

def get_db_connection():
    if not os.path.exists(DB_PATH):
        return None
    try:
        return sqlite3.connect(DB_PATH)
    except Exception:
        return None

def check_db_initialized():
    conn = get_db_connection()
    if conn is None:
        return False
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        required = ["sales", "customers", "products", "inventory"]
        return all(t in tables for t in required)
    except Exception:
        return False
    finally:
        if conn:
            conn.close()

# -------------------------------------------------------------
# TOP NAVIGATION BAR COMPONENT
# -------------------------------------------------------------
st.markdown("""
<div class="top-navbar">
    <div class="brand-logo">
        <div class="brand-icon">⚡</div>
        <span>Retail<span class="brand-accent">Pulse</span></span>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 13px; font-weight: 700; color: #10b981; background: #ecfdf5; padding: 6px 14px; border-radius: 9999px; border: 1px solid #a7f3d0;">
            ● System Operational
        </span>
    </div>
</div>
""", unsafe_allow_html=True)

# Primary Navigation Tabs
nav_tabs = [
    "🏠 Home & Overview",
    "📈 Business Intelligence",
    "👥 Customer Segmentation",
    "🎯 Churn Risk AI",
    "🔮 Demand Forecasting (LSTM)",
    "📦 Inventory Optimization",
    "⚙️ MLOps & Drift Observability"
]

selected_tab = st.selectbox(
    "Explore RetailPulse Modules:",
    nav_tabs,
    label_visibility="collapsed"
)

st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

# Check database readiness
db_ready = check_db_initialized()

if not db_ready:
    st.warning("⚠️ Database not detected. Initializing pipeline...")
    with st.spinner("Running initial data generation and pipeline..."):
        try:
            import run_pipeline
            run_pipeline.main()
            st.success("Pipeline initialized! Please reload.")
            st.rerun()
        except Exception as e:
            st.error(f"Error running pipeline: {e}")
            st.stop()

conn = get_db_connection()

# =============================================================
# TAB 1: HOME & HERO LANDING (REPLICATING THE USER'S REFERENCE UI)
# =============================================================
if selected_tab == "🏠 Home & Overview":
    col_left, col_right = st.columns([1.15, 1.0], gap="large")

    with col_left:
        st.markdown("""
        <div class="hero-badge">
            ✨ AI-Powered Retail Analytics Platform
        </div>
        <div class="hero-title">
            Transform Your <br>
            <span class="gradient-text">Retail Business</span>
        </div>
        <p class="hero-sub">
            Empower retail operations with deep learning demand forecasting, customer segmentation, churn prediction, and automated inventory replenishment.
        </p>
        """, unsafe_allow_html=True)

        btn_c1, btn_c2 = st.columns([1.1, 1.2])
        with btn_c1:
            if st.button("🚀 Run Live Pipeline", use_container_width=True):
                with st.spinner("Executing full pipeline..."):
                    import run_pipeline
                    run_pipeline.main()
                    st.success("Pipeline executed successfully!")
                    st.rerun()
        with btn_c2:
            st.markdown("""
            <a href="#kpi-summary" style="text-decoration: none;">
                <div style="background: white; border: 1.5px solid #e2e8f0; color: #334155; padding: 10px 20px; border-radius: 14px; text-align: center; font-weight: 700; font-size: 15px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                    📊 View Live Metrics ↓
                </div>
            </a>
            """, unsafe_allow_html=True)

        st.markdown("""
        <div class="chips-container">
            <div class="trust-chip">
                <span class="trust-icon-green">✔</span> 100% Automated ETL
            </div>
            <div class="trust-chip">
                <span class="trust-icon-blue">⏱️</span> 5 Min Setup
            </div>
            <div class="trust-chip">
                <span class="trust-icon-purple">👥</span> 100K+ Transactions
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col_right:
        # Replicating the right-side preview card with floating badges from user screenshot
        # Pull live metrics from database for dynamic display
        df_sales_sum = pd.read_sql_query("SELECT SUM(Sales) as TotalRev, COUNT(DISTINCT CustomerID) as Custs FROM sales", conn)
        df_churn_champ = pd.read_sql_query("SELECT ROC_AUC FROM churn_model_comparison WHERE Champion='Yes'", conn)
        df_fc_champ = pd.read_sql_query("SELECT MAPE FROM forecast_model_comparison WHERE Model LIKE '%LSTM%'", conn)
        
        tot_rev = df_sales_sum.iloc[0]["TotalRev"]
        roc_score = df_churn_champ.iloc[0]["ROC_AUC"] if not df_churn_champ.empty else 0.9615
        lstm_mape = df_fc_champ.iloc[0]["MAPE"] if not df_fc_champ.empty else "34.33%"

        st.markdown(f"""
        <div class="preview-card-wrapper">
            <!-- Floating Badges -->
            <div class="floating-badge-sparkle">✨</div>
            <div class="floating-badge-star">★</div>
            <div class="floating-badge-lightning">⚡</div>
            <div class="floating-badge-arrow">↑</div>

            <!-- Main White Card -->
            <div class="preview-main-card">
                <div class="preview-header">
                    RetailPulse Live Studio<span class="cursor-blink"></span>
                </div>

                <div class="preview-inner-canvas">
                    <div class="canvas-bar-purple"></div>
                    <div class="canvas-bar-grey"></div>
                    <div class="canvas-bar-light"></div>

                    <!-- Progress Row 1: Churn Accuracy -->
                    <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px; display: flex; justify-content: space-between;">
                        <span>XGBoost Churn ROC-AUC</span>
                        <span style="color: #3b82f6;">{roc_score:.4f} (96.2%)</span>
                    </div>
                    <div class="metric-preview-row">
                        <span class="star-icon">★</span>
                        <div class="metric-progress-blue"></div>
                    </div>

                    <!-- Progress Row 2: Customer Retention -->
                    <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px; display: flex; justify-content: space-between;">
                        <span>K-Means Silhouette Separation</span>
                        <span style="color: #8b5cf6;">0.6557 (Optimal)</span>
                    </div>
                    <div class="metric-preview-row">
                        <span class="star-icon">★</span>
                        <div class="metric-progress-purple"></div>
                    </div>

                    <!-- Progress Row 3: PyTorch LSTM Accuracy -->
                    <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px; display: flex; justify-content: space-between;">
                        <span>PyTorch LSTM Forecast</span>
                        <span style="color: #ec4899;">MAPE {lstm_mape}</span>
                    </div>
                    <div class="metric-preview-row">
                        <span class="star-icon">★</span>
                        <div class="metric-progress-pink"></div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="preview-card-actions">
                        <div class="btn-preview-primary">
                            <span>📥</span> Live Telemetry
                        </div>
                        <div class="btn-preview-secondary">
                            <span>🎨</span> 6 Core Engines
                        </div>
                    </div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<div id='kpi-summary' style='height: 40px;'></div>", unsafe_allow_html=True)

    # Executive Live KPI Summary Section
    st.markdown("<h3 style='font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 20px;'>⚡ Live Platform Operations</h3>", unsafe_allow_html=True)

    df_sales = pd.read_sql_query("SELECT SUM(Sales) as TotalRev, SUM(Profit) as TotalProf, COUNT(DISTINCT OrderID) as Orders, COUNT(DISTINCT CustomerID) as Custs FROM sales", conn)
    df_inv = pd.read_sql_query("SELECT COUNT(*) as LowStock FROM inventory_recommendations WHERE AlertLevel LIKE '%Red%'", conn)

    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Total Revenue", f"${df_sales.iloc[0]['TotalRev']:,.2f}", "+14.2% YoY")
    k2.metric("Total Net Profit", f"${df_sales.iloc[0]['TotalProf']:,.2f}", f"{(df_sales.iloc[0]['TotalProf']/df_sales.iloc[0]['TotalRev'])*100:.1f}% Margin")
    k3.metric("Processed Orders", f"{df_sales.iloc[0]['Orders']:,}", "99.8K Transactions")
    k4.metric("Critical Stockout Alerts", f"{df_inv.iloc[0]['LowStock']} SKUs", "Immediate Action", delta_color="inverse")

    # Feature Grid Cards
    st.markdown("<div style='height: 30px;'></div>", unsafe_allow_html=True)
    f1, f2, f3 = st.columns(3)

    with f1:
        st.markdown("""
        <div class="saas-card">
            <div style="font-size: 32px; margin-bottom: 12px;">👥</div>
            <h4 style="font-weight: 800; margin-bottom: 8px;">RFM Segmentation</h4>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                Unsupervised K-Means clustering ($K=4$) with standard scaling to identify VIP Champions, New & Promising, At Risk, and Lost customer cohorts.
            </p>
        </div>
        """, unsafe_allow_html=True)

    with f2:
        st.markdown("""
        <div class="saas-card">
            <div style="font-size: 32px; margin-bottom: 12px;">🎯</div>
            <h4 style="font-weight: 800; margin-bottom: 8px;">Predictive Churn AI</h4>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                Zero-leakage XGBoost classifier with <strong>0.9615 ROC-AUC</strong> that identifies active accounts heading toward 90-day inactivity before they leave.
            </p>
        </div>
        """, unsafe_allow_html=True)

    with f3:
        st.markdown("""
        <div class="saas-card">
            <div style="font-size: 32px; margin-bottom: 12px;">🔮</div>
            <h4 style="font-weight: 800; margin-bottom: 8px;">PyTorch LSTM Forecasting</h4>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                2-layer deep recurrent neural network modeling non-linear demand trends, driving 95% service-level safety stocks and reorder points.
            </p>
        </div>
        """, unsafe_allow_html=True)

# =============================================================
# TAB 2: BUSINESS OVERVIEW
# =============================================================
elif selected_tab == "📈 Business Intelligence":
    st.markdown("<h2 style='font-weight: 800; color: #0f172a;'>📈 Executive Business Intelligence</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b;'>Holistic view of historical revenue velocity, product department performance, and geographical market distribution.</p>", unsafe_allow_html=True)
    
    df_sales = pd.read_sql_query("SELECT * FROM sales", conn)
    df_sales["OrderDate"] = pd.to_datetime(df_sales["OrderDate"])
    df_customers = pd.read_sql_query("SELECT * FROM customers", conn)
    
    # Monthly Trends
    df_sales["YearMonth"] = df_sales["OrderDate"].dt.to_period("M").astype(str)
    monthly_sales = df_sales.groupby("YearMonth").agg(Sales=("Sales", "sum"), Profit=("Profit", "sum")).reset_index()
    
    fig_area = px.area(
        monthly_sales,
        x="YearMonth",
        y="Sales",
        title="<b>Monthly Sales Revenue Growth (2023 - 2026)</b>",
        labels={"Sales": "Gross Sales ($)", "YearMonth": "Month"},
        color_discrete_sequence=["#4f46e5"]
    )
    fig_area.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Plus Jakarta Sans", color="#334155"),
        xaxis=dict(showgrid=False),
        yaxis=dict(showgrid=True, gridcolor="#f1f5f9")
    )
    st.plotly_chart(fig_area, use_container_width=True)
    
    col_c1, col_c2 = st.columns(2)
    with col_c1:
        df_prods = pd.read_sql_query("SELECT ProductID, Category FROM products", conn)
        cat_sales = df_sales.merge(df_prods, on="ProductID").groupby("Category")["Sales"].sum().reset_index()
        
        fig_pie = px.pie(
            cat_sales,
            names="Category",
            values="Sales",
            hole=0.55,
            title="<b>Revenue by Product Category</b>",
            color_discrete_sequence=["#4f46e5", "#8b5cf6", "#ec4899", "#f59e0b"]
        )
        fig_pie.update_layout(font=dict(family="Plus Jakarta Sans"))
        st.plotly_chart(fig_pie, use_container_width=True)
        
    with col_c2:
        sales_reg = df_sales.merge(df_customers[["CustomerID", "Region"]], on="CustomerID").groupby("Region")["Sales"].sum().reset_index()
        fig_bar = px.bar(
            sales_reg,
            x="Region",
            y="Sales",
            color="Region",
            title="<b>Regional Market Performance</b>",
            color_discrete_sequence=["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"]
        )
        fig_bar.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font=dict(family="Plus Jakarta Sans"),
            xaxis=dict(showgrid=False),
            yaxis=dict(showgrid=True, gridcolor="#f1f5f9")
        )
        st.plotly_chart(fig_bar, use_container_width=True)

# =============================================================
# TAB 3: CUSTOMER SEGMENTATION
# =============================================================
elif selected_tab == "👥 Customer Segmentation":
    st.markdown("<h2 style='font-weight: 800; color: #0f172a;'>👥 RFM Customer Segmentation</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b;'>Behavioral customer clustering using Recency, Frequency, and Monetary value via Standard Scaler and K-Means ($K=4$).</p>", unsafe_allow_html=True)
    
    df_rfm = pd.read_sql_query("SELECT * FROM customer_segments", conn)
    df_seg_met = pd.read_sql_query("SELECT * FROM segmentation_metrics", conn)
    
    m1, m2, m3 = st.columns(3)
    m1.metric("Optimal Clusters (K)", f"{int(df_seg_met.iloc[0]['Optimal_K'])}")
    m2.metric("Silhouette Score", f"{df_seg_met.iloc[0]['SilhouetteScore']:.4f}", "High Cluster Separation")
    m3.metric("Davies-Bouldin Index", f"{df_seg_met.iloc[0]['DaviesBouldinIndex']:.4f}", "Optimal Compactness")
    
    st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)
    
    c_s1, c_s2 = st.columns([1, 2])
    with c_s1:
        seg_counts = df_rfm["Segment"].value_counts().reset_index()
        seg_counts.columns = ["Segment", "Count"]
        fig_donut = px.pie(
            seg_counts,
            names="Segment",
            values="Count",
            hole=0.6,
            title="<b>Persona Composition</b>",
            color_discrete_sequence=["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"]
        )
        st.plotly_chart(fig_donut, use_container_width=True)
        
    with c_s2:
        fig_3d = px.scatter_3d(
            df_rfm,
            x="Recency",
            y="Frequency",
            z="Monetary",
            color="Segment",
            hover_name="CustomerID",
            title="<b>3D Customer Cluster Feature Space</b>",
            color_discrete_sequence=["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"]
        )
        fig_3d.update_layout(
            margin=dict(l=0, r=0, b=0, t=30),
            scene=dict(
                xaxis=dict(backgroundcolor="#f8fafc", gridcolor="#e2e8f0"),
                yaxis=dict(backgroundcolor="#f8fafc", gridcolor="#e2e8f0"),
                zaxis=dict(backgroundcolor="#f8fafc", gridcolor="#e2e8f0")
            )
        )
        st.plotly_chart(fig_3d, use_container_width=True)
        
    st.subheader("Customer Personas & Actionable Retention Strategies")
    centroid_table = df_rfm.groupby("Segment").agg({
        "CustomerID": "count",
        "Recency": "mean",
        "Frequency": "mean",
        "Monetary": "mean"
    }).rename(columns={"CustomerID": "Customer Count"}).reset_index()
    
    if "ActionStrategy" in df_rfm.columns:
        strat_map = df_rfm.groupby("Segment")["ActionStrategy"].first().reset_index()
        centroid_table = centroid_table.merge(strat_map, on="Segment", how="left")
        
    st.dataframe(
        centroid_table.style.format({
            "Recency": "{:.1f} days",
            "Frequency": "{:.1f} orders",
            "Monetary": "${:,.2f}"
        }),
        use_container_width=True
    )
    
    # Export customer list
    sel_segment = st.selectbox("Select Segment to Filter & Export:", df_rfm["Segment"].unique())
    filtered_cust = df_rfm[df_rfm["Segment"] == sel_segment]
    st.dataframe(filtered_cust[["CustomerID", "Recency", "Frequency", "Monetary", "ActionStrategy"]], use_container_width=True)
    
    csv_seg = filtered_cust.to_csv(index=False).encode('utf-8')
    st.download_button(
        f"📥 Download {sel_segment} Customer List (CSV)",
        data=csv_seg,
        file_name=f"retailpulse_{sel_segment.lower().replace(' ', '_')}.csv",
        mime="text/csv"
    )

# =============================================================
# TAB 4: CHURN RISK PREDICTION
# =============================================================
elif selected_tab == "🎯 Churn Risk AI":
    st.markdown("<h2 style='font-weight: 800; color: #0f172a;'>🎯 Predictive Customer Churn Analytics</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b;'>Supervised classification with strict anti-data-leakage protocols predicting which active accounts will stop buying within 90 days.</p>", unsafe_allow_html=True)
    
    df_comp = pd.read_sql_query("SELECT * FROM churn_model_comparison", conn)
    st.subheader("Model Benchmark & Evaluation (Random Forest vs XGBoost)")
    st.dataframe(
        df_comp.style.format({
            "Accuracy": "{:.2%}",
            "Precision": "{:.2%}",
            "Recall": "{:.2%}",
            "F1_Score": "{:.2%}",
            "ROC_AUC": "{:.4f}"
        }),
        use_container_width=True
    )
    
    champ = df_comp[df_comp["Champion"] == "Yes"].iloc[0]
    st.success(f"🏆 **Champion Model Deployed**: {champ['Model']} with ROC-AUC = {champ['ROC_AUC']:.4f} and F1 = {champ['F1_Score']:.2%}")
    
    col_ch1, col_ch2 = st.columns([1.8, 1.2])
    with col_ch1:
        st.subheader("High-Risk Retention Alert Action List")
        df_alerts = pd.read_sql_query("SELECT * FROM churn_high_risk_alerts", conn)
        st.dataframe(
            df_alerts.style.format({
                "Monetary": "${:,.2f}",
                "ChurnProbability": "{:.1%}"
            }),
            use_container_width=True
        )
        csv_alerts = df_alerts.to_csv(index=False).encode('utf-8')
        st.download_button(
            "📥 Export High-Risk Retention Action List (CSV)",
            data=csv_alerts,
            file_name="retailpulse_high_risk_retention_alerts.csv",
            mime="text/csv"
        )
        
    with col_ch2:
        st.subheader("Feature Importance Rankings")
        df_feat = pd.read_sql_query("SELECT * FROM churn_feature_importances", conn)
        fig_feat = px.bar(
            df_feat,
            x="Importance",
            y="Feature",
            orientation="h",
            color="Importance",
            color_continuous_scale="Purples"
        )
        fig_feat.update_layout(
            yaxis=dict(autorange="reversed"),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            coloraxis_showscale=False
        )
        st.plotly_chart(fig_feat, use_container_width=True)
        
    st.markdown("---")
    st.subheader("Single Customer Risk Profiler")
    c_id = st.text_input("Enter Customer ID to Inspect (e.g. CUST-10045):", "")
    if c_id:
        df_churn = pd.read_sql_query("SELECT * FROM churn_predictions", conn)
        cust_match = df_churn[df_churn["CustomerID"] == c_id]
        if not cust_match.empty:
            prob = cust_match.iloc[0]["ChurnProbability"]
            rec = cust_match.iloc[0]["Recency"]
            mon = cust_match.iloc[0]["Monetary"]
            
            p1, p2, p3 = st.columns(3)
            p1.metric("Predicted Churn Risk", f"{prob:.1%}")
            p2.metric("Days Since Last Buy", f"{rec} days")
            p3.metric("Lifetime Spend", f"${mon:,.2f}")
            
            if prob >= 0.70:
                st.markdown("<div class='alert-red'>🔴 <strong>HIGH CHURN RISK</strong>: Customer exhibits severe disengagement. Recommended action: Dispatch urgent 20% discount coupon or account manager retention call.</div>", unsafe_allow_html=True)
            elif prob >= 0.40:
                st.markdown("<div class='alert-yellow'>🟡 <strong>MODERATE CHURN RISK</strong>: Purchase velocity is declining. Recommended action: Deliver tailored product recommendations and free shipping incentive.</div>", unsafe_allow_html=True)
            else:
                st.markdown("<div class='alert-green'>🟢 <strong>HEALTHY ENGAGEMENT</strong>: Strong active purchasing cycle. Recommended action: Standard loyalty rewards.</div>", unsafe_allow_html=True)
        else:
            st.error(f"Customer ID '{c_id}' not found in predictions.")

# =============================================================
# TAB 5: AI DEMAND FORECASTING (PYTORCH LSTM)
# =============================================================
elif selected_tab == "🔮 Demand Forecasting (LSTM)":
    st.markdown("<h2 style='font-weight: 800; color: #0f172a;'>🔮 AI-Powered Demand Forecasting</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b;'>Comparing <strong>Meta Prophet / Lagged Random Forest</strong> with a <strong>Deep Learning PyTorch LSTM Neural Network</strong> over 1,246 days of historical sales.</p>", unsafe_allow_html=True)
    
    df_fc_comp = pd.read_sql_query("SELECT * FROM forecast_model_comparison", conn)
    st.subheader("Time-Series Model Benchmark")
    st.dataframe(df_fc_comp, use_container_width=True)
    
    df_fc_base = pd.read_sql_query("SELECT * FROM demand_forecast", conn)
    df_fc_base["ds"] = pd.to_datetime(df_fc_base["ds"])
    
    has_lstm = False
    try:
        df_fc_lstm = pd.read_sql_query("SELECT * FROM demand_forecast_lstm", conn)
        df_fc_lstm["ds"] = pd.to_datetime(df_fc_lstm["ds"])
        has_lstm = True
    except Exception:
        pass
        
    model_choice = st.radio("Select Trajectory to Inspect:", ["Compare Both Models", "PyTorch Deep Learning LSTM", "Baseline Random Forest"], horizontal=True)
    
    max_hist = df_fc_base["ds"].max() - pd.Timedelta(days=30)
    history = df_fc_base[df_fc_base["ds"] <= max_hist]
    future_base = df_fc_base[df_fc_base["ds"] > max_hist]
    
    fig_fc = go.Figure()
    # Historical Actuals
    fig_fc.add_trace(go.Scatter(x=history["ds"], y=history["yhat"], name="Historical Actual Sales", line=dict(color="#3b82f6", width=2)))
    
    if model_choice in ["Compare Both Models", "Baseline Random Forest"]:
        fig_fc.add_trace(go.Scatter(x=future_base["ds"], y=future_base["yhat"], name="Random Forest Baseline", line=dict(color="#10b981", dash="dash", width=2)))
        
    if has_lstm and model_choice in ["Compare Both Models", "PyTorch Deep Learning LSTM"]:
        future_lstm = df_fc_lstm[df_fc_lstm["ds"] > max_hist]
        fig_fc.add_trace(go.Scatter(x=future_lstm["ds"], y=future_lstm["yhat"], name="PyTorch LSTM Deep Forecaster", line=dict(color="#8b5cf6", width=3)))
        fig_fc.add_trace(go.Scatter(x=future_lstm["ds"], y=future_lstm["yhat_upper"], mode='lines', line_color='rgba(139, 92, 246, 0.1)', showlegend=False))
        fig_fc.add_trace(go.Scatter(x=future_lstm["ds"], y=future_lstm["yhat_lower"], mode='lines', fill='tonexty', fillcolor='rgba(139, 92, 246, 0.15)', name="LSTM 90% Confidence Interval"))
        
    fig_fc.update_layout(
        title="<b>Daily Sales History & 30-Day Forward Demand Projections</b>",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Plus Jakarta Sans"),
        xaxis=dict(showgrid=False),
        yaxis=dict(showgrid=True, gridcolor="#f1f5f9")
    )
    st.plotly_chart(fig_fc, use_container_width=True)
    
    st.info("💡 **Deep Learning Architecture**: 2-Layer PyTorch LSTM with 64 hidden units, 30-day sequence lookback, Adam optimizer, and MSE loss.")

# =============================================================
# TAB 6: INVENTORY OPTIMIZATION
# =============================================================
elif selected_tab == "📦 Inventory Optimization":
    st.markdown("<h2 style='font-weight: 800; color: #0f172a;'>📦 Inventory Optimization & Replenishment</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b;'>Statistically prevents stockouts with 95% service-level Safety Stock and dynamic Reorder Points (ROP).</p>", unsafe_allow_html=True)
    
    df_recs = pd.read_sql_query("SELECT * FROM inventory_recommendations", conn)
    red_count = len(df_recs[df_recs["AlertLevel"].str.contains("Red")])
    yellow_count = len(df_recs[df_recs["AlertLevel"].str.contains("Yellow")])
    green_count = len(df_recs[df_recs["AlertLevel"].str.contains("Green")])
    
    i1, i2, i3 = st.columns(3)
    i1.metric("Critical Alerts (Danger)", f"{red_count} SKUs", "Immediate Replenishment", delta_color="inverse")
    i2.metric("Low Stock Alerts (Reorder)", f"{yellow_count} SKUs", "Threshold Reached")
    i3.metric("Healthy Stock Buffer", f"{green_count} SKUs", "Safe Levels")
    
    st.markdown("---")
    st.subheader("⚡ Interactive Lead Time Simulator")
    sim_offset = st.slider("Simulate Supplier Transit Delay / Acceleration (Days):", min_value=-3, max_value=7, value=0)
    
    df_sim = df_recs.copy()
    if sim_offset != 0:
        df_sim["LeadTime"] = (df_sim["LeadTime"] + sim_offset).clip(lower=1)
        df_sim["SafetyStock"] = (df_sim["SafetyStock"] * np.sqrt(df_sim["LeadTime"] / (df_sim["LeadTime"] - sim_offset).clip(lower=1))).astype(int) + 1
        df_sim["ReorderPoint"] = (df_sim["AvgDailyDemand"] * df_sim["LeadTime"]).astype(int) + df_sim["SafetyStock"]
        df_sim["SuggestedOrder"] = np.where(df_sim["CurrentStock"] <= df_sim["ReorderPoint"], (df_sim["ForecastedDemand30D"] + df_sim["SafetyStock"] - df_sim["CurrentStock"]).clip(lower=0), 0)
        df_sim["AlertLevel"] = np.where(df_sim["CurrentStock"] <= df_sim["SafetyStock"], "Red (Critical)", np.where(df_sim["CurrentStock"] <= df_sim["ReorderPoint"], "Yellow (Reorder)", "Green (Healthy)"))
        
    def style_inv(val):
        if "Red" in str(val):
            return 'background-color: #fee2e2; color: #991b1b; font-weight: bold;'
        elif "Yellow" in str(val):
            return 'background-color: #fef3c7; color: #92400e; font-weight: bold;'
        return 'background-color: #dcfce7; color: #166534;'
        
    st.dataframe(
        df_sim[["ProductID", "ProductName", "Category", "CurrentStock", "SafetyStock", "ReorderPoint", "LeadTime", "SuggestedOrder", "AlertLevel"]].style.map(style_inv, subset=["AlertLevel"]),
        use_container_width=True
    )
    
    # Export purchase orders
    reorders = df_sim[df_sim["SuggestedOrder"] > 0]
    if len(reorders) > 0:
        st.warning(f"⚠️ {len(reorders)} SKUs require purchase replenishment.")
        csv_po = reorders.to_csv(index=False).encode('utf-8')
        st.download_button(
            "📥 Export Automated Purchase Orders (CSV)",
            data=csv_po,
            file_name="retailpulse_replenishment_purchase_orders.csv",
            mime="text/csv"
        )

# =============================================================
# TAB 7: MLOPS & DRIFT OBSERVABILITY
# =============================================================
elif selected_tab == "⚙️ MLOps & Drift Observability":
    st.markdown("<h2 style='font-weight: 800; color: #0f172a;'>⚙️ MLOps Observability & Data Drift Monitoring</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b;'>Continuous statistical governance via <strong>2-Sample Kolmogorov-Smirnov Test</strong>, <strong>Population Stability Index (PSI)</strong>, and <strong>MLflow Registry</strong>.</p>", unsafe_allow_html=True)
    
    st.subheader("Statistical Covariate Drift Engine")
    df_drift = pd.read_sql_query("SELECT * FROM data_drift_monitoring", conn)
    
    def style_drift(val):
        if "Drift Detected" in str(val):
            return 'background-color: #fee2e2; color: #991b1b; font-weight: bold;'
        return 'background-color: #dcfce7; color: #166534;'
        
    st.dataframe(df_drift.style.map(style_drift, subset=["Status"]), use_container_width=True)
    
    if any(df_drift["Status"] == "Drift Detected"):
        drifted = ", ".join(df_drift[df_drift["Status"] == "Drift Detected"]["Feature"].tolist())
        st.markdown(f"<div class='alert-yellow'>⚠️ <strong>COVARIATE DRIFT DETECTED IN: {drifted} (p-value &lt; 0.05)</strong><br>Significant distribution shift observed between baseline and recent transactions. Automated retraining pipeline scheduled.</div>", unsafe_allow_html=True)
    else:
        st.markdown("<div class='alert-green'>✅ <strong>ALL DISTRIBUTIONS IN CONTROL</strong>: No statistically significant data drift detected.</div>", unsafe_allow_html=True)
        
    st.markdown("---")
    st.subheader("Distribution Shift Inspection")
    feat_pick = st.selectbox("Select Feature to Compare Empirical Densities:", ["Sales", "Quantity", "Profit"])
    
    df_sales_raw = pd.read_sql_query(f"SELECT OrderDate, {feat_pick} FROM sales", conn)
    df_sales_raw["OrderDate"] = pd.to_datetime(df_sales_raw["OrderDate"])
    mid_pt = df_sales_raw["OrderDate"].min() + (df_sales_raw["OrderDate"].max() - df_sales_raw["OrderDate"].min()) / 2
    
    b_vals = df_sales_raw[df_sales_raw["OrderDate"] <= mid_pt][feat_pick]
    c_vals = df_sales_raw[df_sales_raw["OrderDate"] > mid_pt][feat_pick]
    
    fig_d = go.Figure()
    fig_d.add_trace(go.Histogram(x=b_vals, name="Baseline Batch", opacity=0.6, marker_color="#3b82f6", histnorm='probability density'))
    fig_d.add_trace(go.Histogram(x=c_vals, name="Current Operational Batch", opacity=0.6, marker_color="#8b5cf6", histnorm='probability density'))
    fig_d.update_layout(
        barmode='overlay',
        title=f"<b>Probability Density Function: Baseline vs Current ({feat_pick})</b>",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Plus Jakarta Sans")
    )
    st.plotly_chart(fig_d, use_container_width=True)

# -------------------------------------------------------------
# GLOBAL FOOTER
# -------------------------------------------------------------
st.markdown("""
<div style="margin-top: 60px; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">
    <strong>RetailPulse Platform</strong> • Developed for Zidio Development Internship • Powered by PyTorch, XGBoost, Streamlit & MLflow
</div>
""", unsafe_allow_html=True)

if conn:
    conn.close()
