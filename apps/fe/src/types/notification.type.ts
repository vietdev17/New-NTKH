export interface Notification {
  _id: string;
  userId: string;
  type: 'order' | 'promotion' | 'system' | 'review' | 'delivery';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}
