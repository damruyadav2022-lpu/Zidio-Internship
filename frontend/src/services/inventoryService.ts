import { request } from './api';
import { InventoryResponse, PurchaseOrder } from '../types';
import { DEMO_INVENTORY } from '../data/demoData';

export async function fetchInventory(
  category = 'All',
  status = 'All',
  search = '',
  serviceLevel = 95
): Promise<InventoryResponse> {
  const query = new URLSearchParams();
  if (category && category !== 'All') query.append('category', category);
  if (status && status !== 'All') query.append('status', status);
  if (search) query.append('search', search);
  query.append('service_level', serviceLevel.toString());

  return request<InventoryResponse>(
    `/api/inventory?${query.toString()}`,
    { method: 'GET' },
    DEMO_INVENTORY
  );
}

export async function createPurchaseOrder(
  items: Array<{ product_id: string; product_name: string; category: string; quantity: number; unit_price: number }>,
  supplier = 'Global Retail Logistics Ltd.',
  deliveryDays = 7
): Promise<PurchaseOrder> {
  const fallbackPO: PurchaseOrder = {
    status: 'success',
    po_number: `PO-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    created_date: new Date().toISOString(),
    expected_delivery: new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    supplier,
    total_items: items.length,
    total_units: items.reduce((acc, it) => acc + it.quantity, 0),
    total_amount: Number(items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0).toFixed(2)),
    lines: items.map(it => ({
      ProductID: it.product_id,
      ProductName: it.product_name,
      Category: it.category,
      Quantity: it.quantity,
      UnitPrice: it.unit_price,
      Subtotal: Number((it.quantity * it.unit_price).toFixed(2))
    }))
  };

  return request<PurchaseOrder>(
    '/api/inventory/purchase-order',
    {
      method: 'POST',
      body: JSON.stringify({ items, supplier, delivery_days: deliveryDays })
    },
    fallbackPO
  );
}
