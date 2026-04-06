export interface Shipper {
  _id: string;
  user: import('./user.type').User;
  status: 'available' | 'busy' | 'offline';
  vehicleType: string;
  licensePlate: string;
  currentLocation?: { lat: number; lng: number };
  totalDeliveries: number;
  successRate: number;
  avgRating: number;
  totalEarnings: number;
}

export interface DeliveryAssignment {
  _id: string;
  orderId: string;
  shipperId: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  pickupTime?: string;
  deliveredTime?: string;
  proofPhoto?: string;
  note?: string;
}
