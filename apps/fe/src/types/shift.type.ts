export interface Shift {
  _id: string;
  staff: { _id: string; fullName: string; staffCode: string };
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  openingBalance: number;
  closingBalance?: number;
  totalSales: number;
  totalOrders: number;
  totalReturns: number;
  note?: string;
  createdAt: string;
}
