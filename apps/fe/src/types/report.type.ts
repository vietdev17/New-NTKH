export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
}

export interface RevenueReport {
  period: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export interface ProductReport {
  productId: string;
  productName: string;
  productImage: string;
  totalSold: number;
  totalRevenue: number;
  avgRating: number;
}

export interface CustomerReport {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  topSpenders: { customerId: string; name: string; totalSpent: number }[];
}
