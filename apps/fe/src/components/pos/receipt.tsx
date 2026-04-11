'use client';

import { forwardRef } from 'react';
import { STORE } from '@/lib/store-info';

interface ReceiptItem {
  name: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptCustomer {
  fullName: string;
  phone: string;
  address?: string;
}

interface ReceiptOrder {
  orderNumber: string;
  createdAt: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  shippingFee?: number;
  paidAmount?: number;
  depositAmount?: number;
  paymentMethod?: string;
  customer?: ReceiptCustomer | null;
  cashReceived?: number;
  changeAmount?: number;
}

interface ReceiptProps {
  order: ReceiptOrder;
  cashierName?: string;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ order, cashierName }, ref) => {
    const fmt = (n: number) =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
      }).format(n);

    const fmtDate = (d: string) => {
      const date = new Date(d);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const isDepositOrder =
      order.paymentMethod === 'deposit' ||
      order.paymentMethod === 'deposit_cash' ||
      order.paymentMethod === 'deposit_bank';

    const pmLabel =
      isDepositOrder
        ? 'Dat coc'
        : order.paymentMethod === 'bank_transfer'
        ? 'Chuyen khoan'
        : order.paymentMethod === 'cod'
        ? 'COD'
        : 'Tien mat';

    return (
      <>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body * { visibility: hidden; }
                .pos-receipt,
                .pos-receipt * { visibility: visible; }
                .pos-receipt {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 80mm;
                }
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
              }
            `,
          }}
        />
        <div
          ref={ref}
          className="pos-receipt"
          style={{
            width: '80mm',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '12px',
            lineHeight: '1.4',
            padding: '4mm',
            color: '#000',
            background: '#fff',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>
              {STORE.name.toUpperCase()}
            </div>
            <div style={{ fontSize: '10px' }}>{STORE.address}</div>
            <div style={{ fontSize: '10px' }}>SDT: {STORE.phone}</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Order info */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '13px' }}>
              HOA DON BAN HANG
            </div>
            <div>So: {order.orderNumber}</div>
            <div>Ngay: {fmtDate(order.createdAt)}</div>
            {cashierName && <div>Thu ngan: {cashierName}</div>}
            {order.customer && (
              <div>
                KH: {order.customer.fullName} - {order.customer.phone}
              </div>
            )}
            {order.customer?.address && (
              <div style={{ fontSize: '10px' }}>
                DC: {order.customer.address}
              </div>
            )}
            <div>TT: {pmLabel}</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Items */}
          <div style={{ marginBottom: '6px' }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ flex: 1 }}>{item.name}</span>
                  <span>{fmt(item.total)}</span>
                </div>
                {item.variantLabel && (
                  <div style={{ fontSize: '10px', color: '#666', paddingLeft: '8px' }}>
                    {item.variantLabel}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#666',
                    paddingLeft: '8px',
                  }}
                >
                  <span>x{item.quantity}</span>
                  <span>{fmt(item.unitPrice)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Totals */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tam tinh:</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            {(order.discountAmount ?? 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c00' }}>
                <span>Giam gia:</span>
                <span>-{fmt(order.discountAmount)}</span>
              </div>
            )}
            {(order.shippingFee ?? 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Van chuyen:</span>
                <span>{fmt(order.shippingFee ?? 0)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '14px',
                borderTop: '1px dashed #000',
                paddingTop: '4px',
                marginTop: '4px',
              }}
            >
              <span>TONG CONG:</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>

          {/* Payment info */}
          {isDepositOrder && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Da coc:</span>
                <span style={{ color: '#00a000' }}>
                  {fmt(order.paidAmount || order.depositAmount || 0)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c00' }}>
                <span>Con lai (COD):</span>
                <span>
                  {fmt(
                    Math.max(
                      0,
                      order.total -
                        (order.paidAmount || order.depositAmount || 0),
                    ),
                  )}
                </span>
              </div>
            </>
          )}

          {!isDepositOrder && (
            <>
              {(order.paidAmount ?? 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{pmLabel}:</span>
                  <span>{fmt(order.paidAmount ?? 0)}</span>
                </div>
              )}
              {(order.cashReceived ?? 0) > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tien mat:</span>
                    <span>{fmt(order.cashReceived ?? 0)}</span>
                  </div>
                  {(order.changeAmount ?? 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00a000' }}>
                      <span>Tien thoi:</span>
                      <span>{fmt(order.changeAmount ?? 0)}</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '11px' }}>
            <div>Cam on quy khach!</div>
            <div>Hen gap lai!</div>
            <div style={{ marginTop: '4px', fontSize: '9px' }}>
              {STORE.domain}
            </div>
          </div>
        </div>
      </>
    );
  },
);

Receipt.displayName = 'Receipt';
export { Receipt };
