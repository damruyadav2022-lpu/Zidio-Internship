# RetailPulse Enterprise: Product Analytics & Growth Instrumentation

**Framework**: Privacy-First Product Telemetry & Growth Instrumentation  
**Version**: 3.2.0-Production  

---

## 1. Core Product Growth Metrics

| Metric Hierarchy | Metric Name | Definition | Target Benchmark |
| :--- | :--- | :--- | :--- |
| **North Star Metric** | **Inventory Dollars Optimized per Week** | Total dollar volume of inventory stock governed under automated safety stock and ROP rules. | $> \$1.5\text{M}$ per active brand |
| **Activation Metric** | **First Automated PO Generation** | Time from initial store connection (Shopify) to first supplier purchase order generated. | $< 24\text{ hours}$ |
| **Retention Metric** | **Weekly Active Merchandisers (WAM)** | Percentage of invited team members viewing churn alerts or inventory recommendations weekly. | $> 75\%$ |
| **Conversion Metric** | **Trial to Paid Growth Subscription** | Percentage of 14-day trial accounts transitioning to annual Growth tier. | $> 18\%$ |
| **Revenue Metric** | **Net Revenue Retention (NRR)** | Expansion revenue from additional SKUs and stores minus churn. | $> 115\%$ |

---

## 2. Telemetry Event Taxonomy

All frontend and backend analytics events are logged without personal identifying information (PII):

```
client.event("feature_used", {
  "org_id": "org_41a8",
  "feature_name": "inventory_service_level_adjusted",
  "previous_level": 95,
  "new_level": 99,
  "affected_skus": 42
})
```

### Critical Funnel Events
1. `user_signed_up`: Account registered.
2. `store_connected`: Shopify or WooCommerce API credentials validated.
3. `initial_forecast_completed`: First demand forecast trajectory generated.
4. `po_email_dispatched`: Supplier order confirmed.
5. `churn_retention_synced`: Klaviyo segment pushed.
6. `subscription_upgraded`: Transition from Starter to Growth/Enterprise.
