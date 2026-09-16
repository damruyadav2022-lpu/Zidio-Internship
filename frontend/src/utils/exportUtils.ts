import jsPDF from 'jspdf';
import { PurchaseOrder } from '../types';
import { formatCurrency, formatDate } from './formatters';

/**
 * Trigger CSV file download from object array
 */
export function exportToCSV(data: Record<string, any>[], filename = 'retailpulse-export.csv'): void {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      let val = obj[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'string') {
        // Escape quotes
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download professional Purchase Order PDF
 */
export function exportPurchaseOrderPDF(po: PurchaseOrder): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Colors
  const primaryColor = [79, 70, 229]; // Indigo
  const textColor = [23, 26, 34];
  const mutedColor = [115, 118, 130];

  // Header Banner
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 40, 'F');

  // Brand Name & Logo mark
  doc.setFillColor(255, 100, 45); // Orange
  doc.roundedRect(15, 12, 10, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RP', 17.5, 18.5);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RETAILPULSE', 28, 19);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('AI Retail Intelligence & Decision Platform', 28, 23);

  // PO Title & Meta on right
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('PURCHASE ORDER', 140, 17);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`PO #: ${po.po_number}`, 140, 22);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`Date: ${formatDate(po.created_date)}`, 140, 26);
  doc.text(`Delivery By: ${formatDate(po.expected_delivery)}`, 140, 30);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 42, 195, 42);

  // Vendor & Ship To Info
  let y = 50;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('VENDOR / SUPPLIER:', 15, y);
  doc.text('SHIP TO / WAREHOUSE:', 110, y);

  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(po.supplier || 'Global Retail Logistics Ltd.', 15, y);
  doc.text('RetailPulse Central Fulfillment Hub #04', 110, y);

  y += 4;
  doc.text('Supply Chain Partner ID: SUP-88210', 15, y);
  doc.text('440 Innovation Park, Logistics Sector', 110, y);

  y += 4;
  doc.text('orders@logistics-retail.com', 15, y);
  doc.text('Receiving Dock B, Priority Freight', 110, y);

  // Table Header
  y += 14;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y - 4, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('SKU / ITEM', 18, y + 1);
  doc.text('DESCRIPTION', 50, y + 1);
  doc.text('QTY', 125, y + 1);
  doc.text('UNIT PRICE', 145, y + 1);
  doc.text('TOTAL', 175, y + 1);

  // Line items
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  po.lines.forEach((line) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(line.ProductID, 18, y);
    doc.text(line.ProductName.length > 35 ? `${line.ProductName.slice(0, 32)}...` : line.ProductName, 50, y);
    doc.text(line.Quantity.toString(), 125, y);
    doc.text(formatCurrency(line.UnitPrice), 145, y);
    doc.text(formatCurrency(line.Subtotal), 175, y);

    y += 6;
    doc.setDrawColor(241, 245, 249);
    doc.line(15, y - 2, 195, y - 2);
  });

  // Summary Box
  y += 6;
  doc.setFillColor(248, 250, 252);
  doc.rect(120, y, 75, 26, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(120, y, 75, 26, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Items:', 125, y + 7);
  doc.text(po.total_items.toString(), 180, y + 7, { align: 'right' });

  doc.text('Total Units:', 125, y + 14);
  doc.text(po.total_units.toString(), 180, y + 14, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PO Total:', 125, y + 22);
  doc.text(formatCurrency(po.total_amount), 180, y + 22, { align: 'right' });

  // Signature / Approval
  y += 40;
  if (y < 265) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Authorized By: Automated Inventory Optimization Engine', 15, y);
    doc.text('Signature: ___________________________', 125, y);
    doc.text('Status: System Approved • Generated from RetailPulse Inventory Engine', 15, y + 6);
  }

  // Save PDF
  doc.save(`${po.po_number}.pdf`);
}

export const exportToCsv = exportToCSV;
