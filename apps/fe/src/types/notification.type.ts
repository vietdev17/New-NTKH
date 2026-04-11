export interface Notification {
  _id: string;
  userId: string;
  type: 'order_created' | 'order_status_changed' | 'order_in_transit' | 'payment_received' | 'shipper_assigned' | 'low_stock' | 'new_review' | 'return_requested' | 'system' | 'promotion';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}
