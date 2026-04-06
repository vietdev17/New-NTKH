export interface Review {
  _id: string;
  product: { _id: string; name: string; slug: string; images: string[] };
  customer: { _id: string; fullName: string; avatar?: string };
  rating: number;
  comment: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  adminReply?: string;
  orderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  avgRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}
