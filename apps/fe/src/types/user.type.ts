export interface Address {
  isDefault: boolean;
  fullName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  note?: string;
  lat?: number;
  lng?: number;
}

export interface User {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'staff' | 'customer' | 'shipper';
  addresses: Address[];
  loyaltyPoints: number;
  isActive: boolean;
  isEmailVerified: boolean;
  // Shipper-specific
  shipperStatus?: 'available' | 'busy' | 'offline';
  vehicleType?: string;
  licensePlate?: string;
  // Staff-specific
  staffCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}
