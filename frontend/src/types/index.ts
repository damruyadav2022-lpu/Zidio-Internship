// RetailPulse Core TypeScript Definitions

export type DateRange = 'today' | '7d' | '30d' | '90d' | '12m' | 'all';

export type SegmentType = 'VIP Champions' | 'Loyal Customers' | 'Potential Loyalists' | 'At-Risk Customers' | 'Lost Customers' | 'All';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'All';

export interface DashboardKPIs {
  total_revenue: number;
  total_profit: number;
  profit_margin: number;
  total_orders: number;
  active_customers: number;
  aov: number;
  inventory_risk_pct: number;
  churn_risk_pct: number;
  critical_skus: number;
}

export interface MonthlyTrend {
  YearMonth: string;
  Sales: number;
  Profit: number;
  Orders: number;
}

export interface CategorySales {
  Category: string;
  Sales: number;
  Quantity: number;
  Share: number;
}

export interface RegionalSales {
  Region: string;
  Sales: number;
  Orders: number;
}

export interface TopProduct {
  ProductID: string;
  ProductName: string;
  Category: string;
  Revenue: number;
  UnitsSold: number;
}

export interface AIRecommendation {
  id: string;
  type: 'demand_forecast' | 'churn_retention' | 'inventory_rop';
  title: string;
  description: string;
  action: string;
  confidence: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  route: string;
}

export interface DashboardOverviewResponse {
  date_range: DateRange;
  kpis: DashboardKPIs;
  monthly_trends: MonthlyTrend[];
  category_sales: CategorySales[];
  regional_sales: RegionalSales[];
  top_products: TopProduct[];
  ai_recommendations: AIRecommendation[];
  last_updated: string;
}

// Customer Types
export interface CustomerOrder {
  OrderID: string;
  OrderDate: string;
  ProductID: string;
  Sales: number;
  Quantity: number;
  Profit: number;
  Discount: number;
}

export interface Customer {
  CustomerID: string;
  CustomerName: string;
  Email: string;
  Region: string;
  SignupDate: string;
  Recency: number;
  Frequency: number;
  Monetary: number;
  Segment: string;
  ActionStrategy: string;
  ChurnProbability: number;
  ChurnRiskLevel: 'Low' | 'Medium' | 'High';
}

export interface CustomerDetail extends Customer {
  RiskLevel: 'Low' | 'Medium' | 'High';
  RetentionAction: string;
  TopRiskFactors: string[];
  OrdersHistory: CustomerOrder[];
}

export interface PaginatedCustomersResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: Customer[];
}

// Segmentation Types
export interface Persona {
  Segment: string;
  CustomerCount: number;
  CustomerPct: number;
  AvgRecency: number;
  AvgFrequency: number;
  AvgMonetary: number;
  TotalMonetary: number;
  RevenuePct: number;
  ActionStrategy: string;
}

export interface ScatterPoint {
  CustomerID: string;
  Segment: string;
  Recency: number;
  Frequency: number;
  Monetary: number;
  pca_x: number;
  pca_y: number;
}

export interface SegmentationResponse {
  metrics: {
    OptimalClusters: number;
    SilhouetteScore: number;
    DaviesBouldinIndex: number;
  };
  personas: Persona[];
  scatter_points: ScatterPoint[];
  rfm_distributions: {
    Recency: { min: number; p25: number; median: number; p75: number; max: number };
    Frequency: { min: number; p25: number; median: number; p75: number; max: number };
    Monetary: { min: number; p25: number; median: number; p75: number; max: number };
  };
}

// Churn Types
export interface ChurnBenchmark {
  Model: string;
  Accuracy: number;
  Precision: number;
  Recall: number;
  'F1-Score': number;
  'ROC-AUC': number;
}

export interface ChurnFeatureImportance {
  Feature: string;
  Importance: number;
}

export interface HighRiskAlert {
  CustomerID: string;
  Recency: number;
  Frequency: number;
  Monetary: number;
  ChurnProbability: number;
  RiskLevel: 'High' | 'Medium';
  Action: string;
}

export interface ChurnIntelligenceResponse {
  summary: {
    total_customers_scored: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    revenue_at_risk: number;
    champion_model: string;
  };
  benchmarks: ChurnBenchmark[];
  feature_importances: ChurnFeatureImportance[];
  high_risk_alerts: HighRiskAlert[];
  roc_curve_points: Array<{ fpr: number; tpr: number }>;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
}

// Forecasting Types
export interface ForecastBenchmark {
  Model: string;
  MAE: number;
  RMSE: number;
  MAPE: string;
  IsBest: boolean;
}

export interface HistoryPoint {
  ds: string;
  actual: number;
}

export interface ForecastPoint {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface ForecastingResponse {
  selected_model: string;
  horizon: number;
  category: string;
  benchmarks: ForecastBenchmark[];
  history: HistoryPoint[];
  active_forecast: ForecastPoint[];
  models_comparison: {
    lstm: ForecastPoint[];
    random_forest: ForecastPoint[];
    prophet: ForecastPoint[];
    ensemble: ForecastPoint[];
  };
  simulator_defaults: {
    base_daily_demand: number;
    lead_time_days: number;
    unit_cost: number;
    service_level_z: number;
  };
}

// Inventory Types
export interface InventoryItem {
  ProductID: string;
  ProductName: string;
  Category: string;
  CurrentStock: number;
  DailyDemand: number;
  SafetyStock: number;
  ReorderPoint: number;
  CoverageDays: number;
  SuggestedOrder: number;
  AlertLevel: string;
  Price: number;
  TotalOrderValue: number;
}

export interface InventorySummary {
  total_skus: number;
  critical_red: number;
  reorder_yellow: number;
  healthy_green: number;
  total_reorder_qty: number;
  total_reorder_capital: number;
  service_level: number;
  z_score: number;
}

export interface InventoryResponse {
  summary: InventorySummary;
  items: InventoryItem[];
}

export interface PurchaseOrderLine {
  ProductID: string;
  ProductName: string;
  Category: string;
  Quantity: number;
  UnitPrice: number;
  Subtotal: number;
}

export interface PurchaseOrder {
  status: string;
  po_number: string;
  created_date: string;
  expected_delivery: string;
  supplier: string;
  total_items: number;
  total_units: number;
  total_amount: number;
  lines: PurchaseOrderLine[];
}

// MLOps Types
export interface ModelRegistryItem {
  model_name: string;
  version: string;
  stage: 'Production' | 'Staging';
  status: string;
  framework: string;
  last_trained: string;
  primary_metric: string;
  [key: string]: any;
}

export interface MLflowExperiment {
  run_id: string;
  experiment_name: string;
  artifact_uri: string;
  status: string;
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  duration: string;
}

export interface DriftRow {
  Feature: string;
  KS_Statistic: number;
  P_Value: number;
  Status: 'Stable' | 'Warning' | 'Drift Detected';
  Interpretation: string;
}

export interface SystemHealthItem {
  service: string;
  status: string;
  latency_ms: number;
  [key: string]: any;
}

export interface MLOpsResponse {
  model_registry: ModelRegistryItem[];
  mlflow_experiments: MLflowExperiment[];
  drift_monitoring: DriftRow[];
  distributions: {
    Sales: { baseline: number[]; current: number[] };
    Quantity: { baseline: number[]; current: number[] };
    Profit: { baseline: number[]; current: number[] };
  };
  system_health: SystemHealthItem[];
  data_freshness: {
    last_pipeline_run: string;
    total_transactions: number;
    status: string;
  };
}

// Billing & Payment Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  category: string;
  tagline: string;
  monthly_price: number;
  annual_monthly_price: number;
  annual_total: number;
  is_popular: boolean;
  is_custom?: boolean;
  cta_text: string;
  features: string[];
}

export interface UserSubscription {
  id: number;
  plan_id: string;
  plan_name: string;
  billing_cycle: 'monthly' | 'annual';
  price: number;
  currency: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  card_last4?: string;
}

export interface CheckoutPayload {
  plan_id: string;
  billing_cycle: 'monthly' | 'annual';
  cardholder_name: string;
  card_number: string;
  exp_month: string;
  exp_year: string;
  cvv: string;
  billing_email?: string;
  company_name?: string;
  postal_code?: string;
  country?: string;
  payment_method?: string;
  upi_id?: string;
  coupon_code?: string;
}

export interface TransactionConfirmation {
  transaction_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  base_price: number;
  discount_amount: number;
  coupon_code?: string;
  plan_id: string;
  plan_name: string;
  billing_cycle: string;
  payment_method: string;
  card_last4: string;
  cardholder_name: string;
  billing_email: string;
  current_period_end: string;
  created_at: string;
}

export interface InvoiceRecord {
  id: number;
  invoice_number: string;
  amount: number;
  currency: string;
  payment_method: string;
  card_last4: string;
  status: string;
  transaction_id: string;
  coupon_code?: string;
  discount_amount: number;
  date: string;
  created_at: string;
  plan_name: string;
  billing_cycle: string;
}

export interface InvoiceReceiptDetails {
  company: {
    name: string;
    address: string;
    city: string;
    tax_id: string;
    support_email: string;
  };
  invoice: {
    invoice_number: string;
    date: string;
    transaction_id: string;
    status: string;
    amount: number;
    currency: string;
    discount_amount: number;
    payment_method: string;
    card_last4: string;
    plan_name: string;
    billing_cycle: string;
    customer_name: string;
    customer_email: string;
    customer_company: string;
  };
}

export interface EnterpriseInquiryPayload {
  name: string;
  email: string;
  company: string;
  estimated_skus?: string;
  requirements?: string;
  notes?: string;
}

// ==========================================
// Commercial Multi-Tenant & Platform Types
// ==========================================

export interface Organization {
  id: number;
  name: string;
  slug: string;
  plan_id: string;
  created_at: string;
}

export interface Store {
  id: number;
  organization_id: number;
  name: string;
  platform: string;
  domain?: string;
  currency: string;
  timezone: string;
  is_active: number;
  is_live: number;
  created_at: string;
}

export interface OrganizationMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'inventory_manager' | 'marketer' | 'analyst';
  title?: string;
  joined_at: string;
}

export interface OrganizationResponse {
  organization: Organization;
  stores: Store[];
  members: OrganizationMember[];
}

export interface IntegrationDirectoryPlatform {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  logo: string;
  status: string;
  docs_url: string;
}

export interface IntegrationItem {
  id: number;
  organization_id: number;
  store_id: number;
  platform: string;
  name: string;
  status: string;
  config?: Record<string, any>;
  last_sync_at: string;
  sync_frequency_minutes: number;
  created_at: string;
}

export interface SmartCsvResult {
  status: string;
  filename: string;
  total_rows: number;
  sampled_rows: number;
  valid_sample_rows: number;
  column_mapping: Record<string, string>;
  detected_columns: string[];
  errors: Array<{ row: number; errors: string[] }>;
  preview: Record<string, any>[];
  message: string;
}

export interface BackgroundTask {
  id: string;
  organization_id: number;
  job_type: string;
  title: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  result_json?: string;
  created_at: string;
  completed_at?: string;
}

export interface AuditLogEntry {
  id: number;
  organization_id: number;
  user_id: number;
  user_email: string;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  total_count: number;
  returned_count: number;
}

export interface ApiKeyItem {
  id: number;
  name: string;
  key_prefix: string;
  environment: 'live' | 'sandbox';
  status: string;
  last_used_at?: string;
  created_at: string;
  full_key?: string;
}

export interface WebhookEndpoint {
  id: number;
  organization_id: number;
  name: string;
  service_type: string;
  target_url: string;
  events: string[];
  is_active: number;
  created_at: string;
}
