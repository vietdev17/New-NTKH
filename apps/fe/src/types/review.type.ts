export interface Review {
  _id: string;
  productId: string;
  userId: { _id: string; fullName: string; avatar?: string; email?: string };
  orderId: string;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  helpfulCount: number;
  unhelpfulCount: number;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}
