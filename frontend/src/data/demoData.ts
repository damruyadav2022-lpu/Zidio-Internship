import {
  DashboardOverviewResponse,
  PaginatedCustomersResponse,
  CustomerDetail,
  SegmentationResponse,
  ChurnIntelligenceResponse,
  ForecastingResponse,
  InventoryResponse,
  MLOpsResponse
} from '../types';

export const DEMO_OVERVIEW: DashboardOverviewResponse = {
  date_range: '30d',
  kpis: {
    total_revenue: 1842900.50,
    total_profit: 462150.20,
    profit_margin: 25.08,
    total_orders: 48291,
    active_customers: 12840,
    aov: 143.50,
    inventory_risk_pct: 8.6,
    churn_risk_pct: 11.4,
    critical_skus: 14
  },
  monthly_trends: [
    { YearMonth: '2025-08', Sales: 132000, Profit: 32800, Orders: 3420 },
    { YearMonth: '2025-09', Sales: 145000, Profit: 36400, Orders: 3810 },
    { YearMonth: '2025-10', Sales: 158000, Profit: 39500, Orders: 4120 },
    { YearMonth: '2025-11', Sales: 189000, Profit: 47200, Orders: 4950 },
    { YearMonth: '2025-12', Sales: 215000, Profit: 54100, Orders: 5610 },
    { YearMonth: '2026-01', Sales: 162000, Profit: 40500, Orders: 4230 },
    { YearMonth: '2026-02', Sales: 154000, Profit: 38200, Orders: 4010 },
    { YearMonth: '2026-03', Sales: 172000, Profit: 43100, Orders: 4490 },
    { YearMonth: '2026-04', Sales: 181000, Profit: 45400, Orders: 4710 },
    { YearMonth: '2026-05', Sales: 194000, Profit: 48800, Orders: 5020 },
    { YearMonth: '2026-06', Sales: 208000, Profit: 52300, Orders: 5410 },
    { YearMonth: '2026-07', Sales: 226000, Profit: 57100, Orders: 5900 }
  ],
  category_sales: [
    { Category: 'Technology', Sales: 842000, Quantity: 2410, Share: 45.7 },
    { Category: 'Furniture', Sales: 574000, Quantity: 3820, Share: 31.1 },
    { Category: 'Office Supplies', Sales: 426900, Quantity: 8940, Share: 23.2 }
  ],
  regional_sales: [
    { Region: 'West Region', Sales: 624000, Orders: 16400 },
    { Region: 'East Region', Sales: 512000, Orders: 13200 },
    { Region: 'Central Region', Sales: 438000, Orders: 11400 },
    { Region: 'South Region', Sales: 268900, Orders: 7291 }
  ],
  top_products: [
    { ProductID: 'PROD-10024', ProductName: 'Ultra-HD Smart Monitor 32"', Category: 'Technology', Revenue: 142800, UnitsSold: 320 },
    { ProductID: 'PROD-10008', ProductName: 'Ergonomic Executive Mesh Chair', Category: 'Furniture', Revenue: 98400, UnitsSold: 410 },
    { ProductID: 'PROD-10056', ProductName: 'High-Speed Wireless Router Pro', Category: 'Technology', Revenue: 87500, UnitsSold: 580 },
    { ProductID: 'PROD-10012', ProductName: 'Solid Oak Modular Work Desk', Category: 'Furniture', Revenue: 82100, UnitsSold: 190 },
    { ProductID: 'PROD-10089', ProductName: 'Smart Thermal Receipt Printer', Category: 'Office Supplies', Revenue: 64200, UnitsSold: 610 }
  ],
  ai_recommendations: [
    {
      id: 'rec-1',
      type: 'demand_forecast',
      title: 'Surging Technology Demand Ahead',
      description: 'Technology category demand is projected to expand by +24.3% over the next 30 days based on the 2-layer PyTorch LSTM model.',
      action: 'Increase buffer inventory by ~180 units across top electronics SKUs.',
      confidence: 91,
      urgency: 'High',
      route: '/app/forecast'
    },
    {
      id: 'rec-2',
      type: 'churn_retention',
      title: 'VIP Champions Retention Risk Window',
      description: '18 high-value accounts show inactivity exceeding 60 days with XGBoost churn risk score > 70%.',
      action: 'Deploy automated 20% loyalty incentive and dedicated account manager outreach.',
      confidence: 88,
      urgency: 'Critical',
      route: '/app/churn'
    },
    {
      id: 'rec-3',
      type: 'inventory_rop',
      title: 'Safety Stock Breach Detected',
      description: '14 warehouse SKUs have dropped below statistical Reorder Point (ROP) with supplier lead time of 7 days.',
      action: 'Generate Purchase Order for recommended replenishment batches immediately.',
      confidence: 95,
      urgency: 'Critical',
      route: '/app/inventory'
    }
  ],
  last_updated: new Date().toISOString()
};

export const DEMO_CUSTOMERS: PaginatedCustomersResponse = {
  total: 40,
  page: 1,
  limit: 20,
  total_pages: 2,
  items: [
    {
      CustomerID: 'CUST-10000',
      CustomerName: 'Aarav Mehta',
      Email: 'aarav.mehta@enterprise.retail',
      Region: 'West Region',
      SignupDate: '2024-02-14',
      Recency: 12,
      Frequency: 48,
      Monetary: 18450.00,
      Segment: 'VIP Champions',
      ActionStrategy: 'VIP loyalty privileges, early product drops, executive tier concierge',
      ChurnProbability: 0.052,
      ChurnRiskLevel: 'Low'
    },
    {
      CustomerID: 'CUST-10001',
      CustomerName: 'Priya Sharma',
      Email: 'priya.sharma@enterprise.retail',
      Region: 'East Region',
      SignupDate: '2024-03-01',
      Recency: 18,
      Frequency: 36,
      Monetary: 14200.00,
      Segment: 'VIP Champions',
      ActionStrategy: 'VIP loyalty privileges, early product drops, executive tier concierge',
      ChurnProbability: 0.074,
      ChurnRiskLevel: 'Low'
    },
    {
      CustomerID: 'CUST-10002',
      CustomerName: 'Rohan Gupta',
      Email: 'rohan.gupta@enterprise.retail',
      Region: 'Central Region',
      SignupDate: '2024-01-20',
      Recency: 42,
      Frequency: 22,
      Monetary: 7890.00,
      Segment: 'Loyal Customers',
      ActionStrategy: 'Upsell premium bundles, personalized category discounts',
      ChurnProbability: 0.215,
      ChurnRiskLevel: 'Low'
    },
    {
      CustomerID: 'CUST-10003',
      CustomerName: 'Ananya Iyer',
      Email: 'ananya.iyer@enterprise.retail',
      Region: 'South Region',
      SignupDate: '2024-04-10',
      Recency: 68,
      Frequency: 14,
      Monetary: 4250.00,
      Segment: 'At-Risk Customers',
      ActionStrategy: 'Automated re-engagement campaign, limited-time return voucher',
      ChurnProbability: 0.684,
      ChurnRiskLevel: 'Medium'
    },
    {
      CustomerID: 'CUST-10004',
      CustomerName: 'Vikram Singh',
      Email: 'vikram.singh@enterprise.retail',
      Region: 'West Region',
      SignupDate: '2023-11-15',
      Recency: 110,
      Frequency: 8,
      Monetary: 2150.00,
      Segment: 'Lost Customers',
      ActionStrategy: 'Aggressive win-back email sequence, survey on churn reasons',
      ChurnProbability: 0.892,
      ChurnRiskLevel: 'High'
    },
    {
      CustomerID: 'CUST-10005',
      CustomerName: 'Neha Kapoor',
      Email: 'neha.kapoor@enterprise.retail',
      Region: 'East Region',
      SignupDate: '2024-05-18',
      Recency: 15,
      Frequency: 29,
      Monetary: 9640.00,
      Segment: 'Loyal Customers',
      ActionStrategy: 'Upsell premium bundles, personalized category discounts',
      ChurnProbability: 0.118,
      ChurnRiskLevel: 'Low'
    },
    {
      CustomerID: 'CUST-10006',
      CustomerName: 'Arjun Deshmukh',
      Email: 'arjun.deshmukh@enterprise.retail',
      Region: 'West Region',
      SignupDate: '2024-06-02',
      Recency: 75,
      Frequency: 11,
      Monetary: 3890.00,
      Segment: 'At-Risk Customers',
      ActionStrategy: 'Automated re-engagement campaign, limited-time return voucher',
      ChurnProbability: 0.742,
      ChurnRiskLevel: 'High'
    },
    {
      CustomerID: 'CUST-10007',
      CustomerName: 'Kavita Nair',
      Email: 'kavita.nair@enterprise.retail',
      Region: 'South Region',
      SignupDate: '2024-02-28',
      Recency: 25,
      Frequency: 18,
      Monetary: 5410.00,
      Segment: 'Potential Loyalists',
      ActionStrategy: 'Nurture with cross-sell suggestions and free shipping threshold incentives',
      ChurnProbability: 0.312,
      ChurnRiskLevel: 'Low'
    },
    {
      CustomerID: 'CUST-10008',
      CustomerName: 'Siddharth Rao',
      Email: 'siddharth.rao@enterprise.retail',
      Region: 'Central Region',
      SignupDate: '2023-10-05',
      Recency: 145,
      Frequency: 6,
      Monetary: 1840.00,
      Segment: 'Lost Customers',
      ActionStrategy: 'Aggressive win-back email sequence, survey on churn reasons',
      ChurnProbability: 0.941,
      ChurnRiskLevel: 'High'
    },
    {
      CustomerID: 'CUST-10009',
      CustomerName: 'Divya Joshi',
      Email: 'divya.joshi@enterprise.retail',
      Region: 'East Region',
      SignupDate: '2024-01-11',
      Recency: 9,
      Frequency: 54,
      Monetary: 21800.00,
      Segment: 'VIP Champions',
      ActionStrategy: 'VIP loyalty privileges, early product drops, executive tier concierge',
      ChurnProbability: 0.041,
      ChurnRiskLevel: 'Low'
    }
  ]
};

export const DEMO_CUSTOMER_DETAIL: CustomerDetail = {
  CustomerID: 'CUST-10000',
  CustomerName: 'Aarav Mehta',
  Email: 'aarav.mehta@enterprise.retail',
  Region: 'West Region',
  SignupDate: '2024-02-14',
  Recency: 12,
  Frequency: 48,
  Monetary: 18450.00,
  Segment: 'VIP Champions',
  ActionStrategy: 'VIP loyalty privileges, early product drops, executive tier concierge',
  ChurnProbability: 0.052,
  ChurnRiskLevel: 'Low',
  RiskLevel: 'Low',
  RetentionAction: 'Enroll in Annual Priority Pass, offer complimentary white-glove warranty',
  TopRiskFactors: [
    'Highly active purchasing frequency (avg 1.2 orders/month)',
    'High monetary volume ($18.4k lifetime GMV)',
    'Zero recent payment disputes'
  ],
  OrdersHistory: [
    { OrderID: 'ORD-98401', OrderDate: '2026-07-02', ProductID: 'PROD-10024', Sales: 890.00, Quantity: 2, Profit: 245.00, Discount: 0.05 },
    { OrderID: 'ORD-97812', OrderDate: '2026-06-18', ProductID: 'PROD-10008', Sales: 480.00, Quantity: 1, Profit: 120.00, Discount: 0.00 },
    { OrderID: 'ORD-96540', OrderDate: '2026-05-24', ProductID: 'PROD-10056', Sales: 1250.00, Quantity: 3, Profit: 380.00, Discount: 0.10 },
    { OrderID: 'ORD-95119', OrderDate: '2026-05-02', ProductID: 'PROD-10089', Sales: 340.00, Quantity: 1, Profit: 85.00, Discount: 0.00 }
  ]
};

export const DEMO_SEGMENTATION: SegmentationResponse = {
  metrics: {
    OptimalClusters: 4,
    SilhouetteScore: 0.6557,
    DaviesBouldinIndex: 0.4905
  },
  personas: [
    {
      Segment: 'VIP Champions',
      CustomerCount: 215,
      CustomerPct: 21.5,
      AvgRecency: 14.2,
      AvgFrequency: 42.5,
      AvgMonetary: 16420.50,
      TotalMonetary: 3530407.50,
      RevenuePct: 48.2,
      ActionStrategy: 'VIP exclusive events, zero-fee expedited shipping, premium loyalty concierge'
    },
    {
      Segment: 'Loyal Customers',
      CustomerCount: 340,
      CustomerPct: 34.0,
      AvgRecency: 32.8,
      AvgFrequency: 24.1,
      AvgMonetary: 7850.20,
      TotalMonetary: 2669068.00,
      RevenuePct: 36.4,
      ActionStrategy: 'Upsell complementary products, tier-advancement promotions, targeted bundles'
    },
    {
      Segment: 'At-Risk Customers',
      CustomerCount: 265,
      CustomerPct: 26.5,
      AvgRecency: 78.4,
      AvgFrequency: 11.2,
      AvgMonetary: 3120.40,
      TotalMonetary: 826906.00,
      RevenuePct: 11.3,
      ActionStrategy: 'Automated win-back email cadence, reactivation coupons, feature announcements'
    },
    {
      Segment: 'Lost Customers',
      CustomerCount: 180,
      CustomerPct: 18.0,
      AvgRecency: 142.1,
      AvgFrequency: 5.4,
      AvgMonetary: 1640.80,
      TotalMonetary: 295344.00,
      RevenuePct: 4.1,
      ActionStrategy: 'Exit sentiment survey, aggressive 30% anniversary discount, brand rediscovery'
    }
  ],
  scatter_points: [
    { CustomerID: 'CUST-10000', Segment: 'VIP Champions', Recency: 12, Frequency: 48, Monetary: 18450, pca_x: 2.84, pca_y: 1.45 },
    { CustomerID: 'CUST-10001', Segment: 'VIP Champions', Recency: 18, Frequency: 36, Monetary: 14200, pca_x: 2.45, pca_y: 1.10 },
    { CustomerID: 'CUST-10009', Segment: 'VIP Champions', Recency: 9, Frequency: 54, Monetary: 21800, pca_x: 3.12, pca_y: 1.78 },
    { CustomerID: 'CUST-10002', Segment: 'Loyal Customers', Recency: 42, Frequency: 22, Monetary: 7890, pca_x: 0.85, pca_y: -0.25 },
    { CustomerID: 'CUST-10005', Segment: 'Loyal Customers', Recency: 15, Frequency: 29, Monetary: 9640, pca_x: 1.25, pca_y: 0.15 },
    { CustomerID: 'CUST-10007', Segment: 'Loyal Customers', Recency: 25, Frequency: 18, Monetary: 5410, pca_x: 0.42, pca_y: -0.45 },
    { CustomerID: 'CUST-10003', Segment: 'At-Risk Customers', Recency: 68, Frequency: 14, Monetary: 4250, pca_x: -0.92, pca_y: -0.75 },
    { CustomerID: 'CUST-10006', Segment: 'At-Risk Customers', Recency: 75, Frequency: 11, Monetary: 3890, pca_x: -1.15, pca_y: -0.85 },
    { CustomerID: 'CUST-10004', Segment: 'Lost Customers', Recency: 110, Frequency: 8, Monetary: 2150, pca_x: -2.35, pca_y: -1.45 },
    { CustomerID: 'CUST-10008', Segment: 'Lost Customers', Recency: 145, Frequency: 6, Monetary: 1840, pca_x: -2.95, pca_y: -1.82 }
  ],
  rfm_distributions: {
    Recency: { min: 2, p25: 18, median: 42, p75: 85, max: 180 },
    Frequency: { min: 1, p25: 8, median: 19, p75: 35, max: 74 },
    Monetary: { min: 450, p25: 2400, median: 6800, p75: 12500, max: 34000 }
  }
};

export const DEMO_CHURN: ChurnIntelligenceResponse = {
  summary: {
    total_customers_scored: 1000,
    high_risk_count: 114,
    medium_risk_count: 248,
    low_risk_count: 638,
    revenue_at_risk: 421800.00,
    champion_model: 'XGBoost Classifier (ROC-AUC: 0.9615)'
  },
  benchmarks: [
    { Model: 'XGBoost Classifier (Champion)', Accuracy: 0.904, Precision: 0.842, Recall: 0.825, 'F1-Score': 0.8333, 'ROC-AUC': 0.9615 },
    { Model: 'Random Forest Classifier', Accuracy: 0.860, Precision: 0.785, Recall: 0.665, 'F1-Score': 0.7200, 'ROC-AUC': 0.9475 }
  ],
  feature_importances: [
    { Feature: 'Recency (Days inactive)', Importance: 0.428 },
    { Feature: 'Purchase Frequency', Importance: 0.264 },
    { Feature: 'Monetary Spend (GMV)', Importance: 0.162 },
    { Feature: 'Tenure (Days since signup)', Importance: 0.089 },
    { Feature: 'Average Order Value (AOV)', Importance: 0.057 }
  ],
  high_risk_alerts: [
    { CustomerID: 'CUST-10004', Recency: 110, Frequency: 8, Monetary: 2150, ChurnProbability: 0.892, RiskLevel: 'High', Action: 'Direct Account Outreach & 20% Retention Credit' },
    { CustomerID: 'CUST-10008', Recency: 145, Frequency: 6, Monetary: 1840, ChurnProbability: 0.941, RiskLevel: 'High', Action: 'Direct Account Outreach & 20% Retention Credit' },
    { CustomerID: 'CUST-10006', Recency: 75, Frequency: 11, Monetary: 3890, ChurnProbability: 0.742, RiskLevel: 'High', Action: 'Automated Personalized Re-engagement Email' },
    { CustomerID: 'CUST-10014', Recency: 92, Frequency: 9, Monetary: 2980, ChurnProbability: 0.815, RiskLevel: 'High', Action: 'Direct Account Outreach & 20% Retention Credit' },
    { CustomerID: 'CUST-10022', Recency: 84, Frequency: 12, Monetary: 4120, ChurnProbability: 0.768, RiskLevel: 'High', Action: 'Direct Account Outreach & 20% Retention Credit' }
  ],
  roc_curve_points: [
    { fpr: 0.00, tpr: 0.00 },
    { fpr: 0.02, tpr: 0.35 },
    { fpr: 0.05, tpr: 0.68 },
    { fpr: 0.08, tpr: 0.82 },
    { fpr: 0.12, tpr: 0.91 },
    { fpr: 0.18, tpr: 0.95 },
    { fpr: 0.25, tpr: 0.97 },
    { fpr: 0.40, tpr: 0.99 },
    { fpr: 1.00, tpr: 1.00 }
  ],
  confusion_matrix: {
    true_negative: 178,
    false_positive: 12,
    false_negative: 12,
    true_positive: 48
  }
};

export const DEMO_FORECASTING: ForecastingResponse = {
  selected_model: 'lstm',
  horizon: 30,
  category: 'All',
  benchmarks: [
    { Model: 'PyTorch LSTM (Champion)', MAE: 14.28, RMSE: 18.95, MAPE: '4.82%', IsBest: true },
    { Model: 'Random Forest Regressor', MAE: 16.45, RMSE: 22.10, MAPE: '5.60%', IsBest: false },
    { Model: 'Prophet Additive', MAE: 18.90, RMSE: 25.40, MAPE: '6.45%', IsBest: false },
    { Model: 'Weighted Ensemble', MAE: 14.85, RMSE: 19.30, MAPE: '5.01%', IsBest: false }
  ],
  history: Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (30 - i));
    const base = 260 + Math.sin(i * 0.4) * 35 + (i * 1.5);
    return {
      ds: d.toISOString().split('T')[0],
      actual: Number(base.toFixed(1))
    };
  }),
  active_forecast: Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i + 1));
    const yhat = 310 + Math.sin((i + 30) * 0.4) * 40 + (i * 2.2);
    return {
      ds: d.toISOString().split('T')[0],
      yhat: Number(yhat.toFixed(1)),
      yhat_lower: Number((yhat * 0.91).toFixed(1)),
      yhat_upper: Number((yhat * 1.09).toFixed(1))
    };
  }),
  models_comparison: {
    lstm: Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + (i + 1));
      const yhat = 310 + Math.sin((i + 30) * 0.4) * 40 + (i * 2.2);
      return { ds: d.toISOString().split('T')[0], yhat: Number(yhat.toFixed(1)), yhat_lower: Number((yhat * 0.91).toFixed(1)), yhat_upper: Number((yhat * 1.09).toFixed(1)) };
    }),
    random_forest: Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + (i + 1));
      const yhat = 302 + Math.sin((i + 30) * 0.35) * 32 + (i * 1.8);
      return { ds: d.toISOString().split('T')[0], yhat: Number(yhat.toFixed(1)), yhat_lower: Number((yhat * 0.88).toFixed(1)), yhat_upper: Number((yhat * 1.12).toFixed(1)) };
    }),
    prophet: Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + (i + 1));
      const yhat = 318 + Math.sin((i + 30) * 0.45) * 45 + (i * 2.5);
      return { ds: d.toISOString().split('T')[0], yhat: Number(yhat.toFixed(1)), yhat_lower: Number((yhat * 0.86).toFixed(1)), yhat_upper: Number((yhat * 1.14).toFixed(1)) };
    }),
    ensemble: Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + (i + 1));
      const yhat = 309 + Math.sin((i + 30) * 0.4) * 38 + (i * 2.1);
      return { ds: d.toISOString().split('T')[0], yhat: Number(yhat.toFixed(1)), yhat_lower: Number((yhat * 0.92).toFixed(1)), yhat_upper: Number((yhat * 1.08).toFixed(1)) };
    })
  },
  simulator_defaults: {
    base_daily_demand: 285.0,
    lead_time_days: 7,
    unit_cost: 45.0,
    service_level_z: 1.645
  }
};

export const DEMO_INVENTORY: InventoryResponse = {
  summary: {
    total_skus: 200,
    critical_red: 14,
    reorder_yellow: 42,
    healthy_green: 144,
    total_reorder_qty: 4820,
    total_reorder_capital: 312450.00,
    service_level: 95,
    z_score: 1.645
  },
  items: [
    { ProductID: 'PROD-10024', ProductName: 'Ultra-HD Smart Monitor 32"', Category: 'Technology', CurrentStock: 18, DailyDemand: 8.4, SafetyStock: 32, ReorderPoint: 91, CoverageDays: 2.1, SuggestedOrder: 118, AlertLevel: 'Critical (Red)', Price: 449.00, TotalOrderValue: 52982.00 },
    { ProductID: 'PROD-10008', ProductName: 'Ergonomic Executive Mesh Chair', Category: 'Furniture', CurrentStock: 24, DailyDemand: 6.2, SafetyStock: 25, ReorderPoint: 68, CoverageDays: 3.9, SuggestedOrder: 78, AlertLevel: 'Critical (Red)', Price: 239.00, TotalOrderValue: 18642.00 },
    { ProductID: 'PROD-10056', ProductName: 'High-Speed Wireless Router Pro', Category: 'Technology', CurrentStock: 45, DailyDemand: 9.1, SafetyStock: 35, ReorderPoint: 99, CoverageDays: 4.9, SuggestedOrder: 104, AlertLevel: 'Warning (Yellow)', Price: 149.00, TotalOrderValue: 15496.00 },
    { ProductID: 'PROD-10012', ProductName: 'Solid Oak Modular Work Desk', Category: 'Furniture', CurrentStock: 12, DailyDemand: 3.5, SafetyStock: 15, ReorderPoint: 40, CoverageDays: 3.4, SuggestedOrder: 48, AlertLevel: 'Critical (Red)', Price: 429.00, TotalOrderValue: 20592.00 },
    { ProductID: 'PROD-10089', ProductName: 'Smart Thermal Receipt Printer', Category: 'Office Supplies', CurrentStock: 78, DailyDemand: 12.0, SafetyStock: 42, ReorderPoint: 126, CoverageDays: 6.5, SuggestedOrder: 111, AlertLevel: 'Warning (Yellow)', Price: 99.00, TotalOrderValue: 10989.00 },
    { ProductID: 'PROD-10031', ProductName: 'Noise-Cancelling Bluetooth Headset', Category: 'Technology', CurrentStock: 142, DailyDemand: 14.5, SafetyStock: 52, ReorderPoint: 154, CoverageDays: 9.8, SuggestedOrder: 0, AlertLevel: 'Healthy (Green)', Price: 129.00, TotalOrderValue: 0.00 },
    { ProductID: 'PROD-10045', ProductName: 'Compact Filing Cabinet 3-Drawer', Category: 'Furniture', CurrentStock: 85, DailyDemand: 4.8, SafetyStock: 22, ReorderPoint: 56, CoverageDays: 17.7, SuggestedOrder: 0, AlertLevel: 'Healthy (Green)', Price: 179.00, TotalOrderValue: 0.00 },
    { ProductID: 'PROD-10062', ProductName: 'Recycled Heavyweight Copy Paper 500ct', Category: 'Office Supplies', CurrentStock: 340, DailyDemand: 28.0, SafetyStock: 88, ReorderPoint: 284, CoverageDays: 12.1, SuggestedOrder: 0, AlertLevel: 'Healthy (Green)', Price: 18.00, TotalOrderValue: 0.00 }
  ]
};

export const DEMO_MLOPS: MLOpsResponse = {
  model_registry: [
    {
      model_name: 'XGBoost-Churn-Classifier',
      version: 'v2.1.0',
      stage: 'Production',
      status: 'Healthy',
      framework: 'XGBoost 2.1 / Scikit-learn',
      last_trained: '2026-09-15 11:20 UTC',
      primary_metric: 'ROC-AUC: 0.9615',
      accuracy: '90.40%',
      data_leakage_audit: 'Verified Clean'
    },
    {
      model_name: 'PyTorch-LSTM-DemandForecaster',
      version: 'v3.0.4',
      stage: 'Production',
      status: 'Healthy',
      framework: 'PyTorch 2.6 (2-Layer LSTM, AdamW)',
      last_trained: '2026-09-15 11:35 UTC',
      primary_metric: 'MAE: 14.28 units',
      rmse: '18.95 units',
      lookback_window: '30 Days'
    },
    {
      model_name: 'KMeans-RFM-Segmenter',
      version: 'v1.4.2',
      stage: 'Production',
      status: 'Healthy',
      framework: 'Scikit-Learn (K=4)',
      last_trained: '2026-09-15 11:15 UTC',
      primary_metric: 'Silhouette: 0.6557',
      davies_bouldin: '0.4905',
      clusters: 4
    },
    {
      model_name: 'Lagged-RandomForest-Baseline',
      version: 'v1.2.0',
      stage: 'Staging',
      status: 'Benchmark Only',
      framework: 'Scikit-learn (n_estimators=100)',
      last_trained: '2026-09-15 11:30 UTC',
      primary_metric: 'MAE: 16.45 units',
      rmse: '22.10 units',
      role: 'Comparative Baseline'
    }
  ],
  mlflow_experiments: [
    {
      run_id: 'mlflow-run-98a72f41',
      experiment_name: 'demand_forecasting_lstm',
      artifact_uri: 'mlruns/1/98a72f41/artifacts/model',
      status: 'FINISHED',
      parameters: { epochs: 20, hidden_size: 64, lr: 0.001, batch_size: 16 },
      metrics: { loss: 0.0142, mae: 14.28, rmse: 18.95 },
      duration: '14.2s'
    },
    {
      run_id: 'mlflow-run-43c21b90',
      experiment_name: 'churn_xgboost_benchmark',
      artifact_uri: 'mlruns/2/43c21b90/artifacts/model',
      status: 'FINISHED',
      parameters: { max_depth: 4, n_estimators: 150, learning_rate: 0.05 },
      metrics: { roc_auc: 0.9615, accuracy: 0.904, f1: 0.8333 },
      duration: '8.7s'
    },
    {
      run_id: 'mlflow-run-77e89d12',
      experiment_name: 'customer_rfm_kmeans',
      artifact_uri: 'mlruns/3/77e89d12/artifacts/model',
      status: 'FINISHED',
      parameters: { n_clusters: 4, init: 'k-means++', max_iter: 300 },
      metrics: { silhouette_score: 0.6557, davies_bouldin: 0.4905 },
      duration: '2.4s'
    }
  ],
  drift_monitoring: [
    { Feature: 'Sales', KS_Statistic: 0.0384, P_Value: 0.4812, Status: 'Stable', Interpretation: 'Distributions align with historical reference dataset. Null hypothesis accepted.' },
    { Feature: 'Quantity', KS_Statistic: 0.0412, P_Value: 0.3954, Status: 'Stable', Interpretation: 'No significant divergence in order quantity volume.' },
    { Feature: 'Profit', KS_Statistic: 0.0498, P_Value: 0.2185, Status: 'Stable', Interpretation: 'Gross margin distribution consistent across periods.' }
  ],
  distributions: {
    Sales: {
      baseline: [45, 85, 120, 160, 210, 260, 310, 380, 450, 520, 680, 890],
      current: [50, 92, 130, 175, 225, 275, 330, 410, 480, 550, 720, 940]
    },
    Quantity: {
      baseline: [1, 2, 2, 3, 4, 5, 5, 6, 8, 10, 12, 15],
      current: [1, 2, 3, 3, 4, 5, 6, 7, 9, 11, 13, 16]
    },
    Profit: {
      baseline: [12, 22, 35, 48, 62, 78, 95, 115, 140, 180, 220, 280],
      current: [14, 25, 38, 52, 68, 85, 102, 125, 155, 195, 240, 310]
    }
  },
  system_health: [
    { service: 'FastAPI REST Server', status: 'Operational', latency_ms: 14, uptime: '99.98%' },
    { service: 'SQLite Primary Relational Store', status: 'Operational', latency_ms: 3, tables: 17 },
    { service: 'PyTorch Neural Inference Engine', status: 'Operational', latency_ms: 28, device: 'CPU / Optimized' },
    { service: 'MLflow Tracking Server', status: 'Operational', latency_ms: 19, active_runs: 3 },
    { service: 'Data Pipeline & ETL Watchdog', status: 'Operational', latency_ms: 8, last_sync: '12m ago' }
  ],
  data_freshness: {
    last_pipeline_run: '2026-09-15 11:35:10 UTC',
    total_transactions: 99800,
    status: 'Up-to-date'
  }
};
