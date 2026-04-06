export interface ReturnRequest {
  _id: string;
  order: { _id: string; orderCode: string };
  customer: { _id: string; fullName: string; email: string };
  items: { productName: string; quantity: number; price: number; reason: string }[];
  reason: 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'other';
  description: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  refundAmount: number;
  adminNote?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}
