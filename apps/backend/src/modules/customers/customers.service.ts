import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddressDto } from './dto/address.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  // ===== DANH SACH KHACH HANG (PHAN TRANG + TIM KIEM) =====
  async findAll(query: QueryCustomerDto): Promise<{
    items: UserDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const filter: any = {
      role: UserRole.CUSTOMER,
      isDeleted: false,
    };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -refreshToken -resetPasswordToken')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      items: items as UserDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===== CHI TIET KHACH HANG (KEM SO DON + TONG CHI TIEU) =====
  async findById(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    const customer = await this.userModel
      .findOne({
        _id: new Types.ObjectId(id),
        role: UserRole.CUSTOMER,
        isDeleted: false,
      })
      .select('-password -refreshToken -resetPasswordToken')
      .lean();

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    const orderStats = await this.orderModel.aggregate([
      {
        $match: {
          customerId: new Types.ObjectId(id),
          isDeleted: false,
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
    ]);

    const stats = orderStats[0] || { totalOrders: 0, totalSpent: 0 };

    return {
      ...customer,
      totalOrders: stats.totalOrders,
      totalSpent: stats.totalSpent,
    };
  }

  // ===== TRA CUU NHANH THEO SO DIEN THOAI (POS) =====
  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        phone,
        role: UserRole.CUSTOMER,
        isDeleted: false,
      })
      .select('-password -refreshToken -resetPasswordToken')
      .lean() as any;
  }

  // ===== TAO KHACH HANG MOI =====
  async create(dto: CreateCustomerDto): Promise<UserDocument> {
    // Kiem tra trung so dien thoai
    const existing = await this.userModel.findOne({
      phone: dto.phone,
      isDeleted: false,
    });
    if (existing) {
      throw new ConflictException('So dien thoai da duoc su dung');
    }

    // Kiem tra trung email neu co
    if (dto.email) {
      const existingEmail = await this.userModel.findOne({
        email: dto.email,
        isDeleted: false,
      });
      if (existingEmail) {
        throw new ConflictException('Email da duoc su dung');
      }
    }

    const customer = new this.userModel({
      fullName: dto.fullName || `Khach ${dto.phone.slice(-4)}`,
      phone: dto.phone,
      email: dto.email || `${dto.phone}@placeholder.local`,
      role: UserRole.CUSTOMER,
      isActive: true,
    });

    return customer.save();
  }

  // ===== CAP NHAT THONG TIN KHACH HANG =====
  async update(id: string, dto: UpdateCustomerDto): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    const customer = await this.userModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), role: UserRole.CUSTOMER, isDeleted: false },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .select('-password -refreshToken -resetPasswordToken') as any;

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    return customer;
  }

  // ===== THEM DIA CHI =====
  async addAddress(customerId: string, dto: AddressDto): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    const customer = await this.userModel.findOne({
      _id: new Types.ObjectId(customerId),
      role: UserRole.CUSTOMER,
      isDeleted: false,
    });

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    if (dto.isDefault || customer.addresses.length === 0) {
      customer.addresses.forEach((addr) => (addr.isDefault = false));
      dto.isDefault = true;
    }

    customer.addresses.push(dto as any);
    return customer.save();
  }

  // ===== CAP NHAT DIA CHI =====
  async updateAddress(
    customerId: string,
    addressIndex: number,
    dto: AddressDto,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    const customer = await this.userModel.findOne({
      _id: new Types.ObjectId(customerId),
      role: UserRole.CUSTOMER,
      isDeleted: false,
    });

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }
    if (addressIndex < 0 || addressIndex >= customer.addresses.length) {
      throw new BadRequestException('Chi so dia chi khong hop le');
    }

    Object.assign(customer.addresses[addressIndex], dto);

    if (dto.isDefault) {
      customer.addresses.forEach((addr, i) => {
        if (i !== addressIndex) addr.isDefault = false;
      });
    }

    return customer.save();
  }

  // ===== XOA DIA CHI =====
  async removeAddress(customerId: string, addressIndex: number): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    const customer = await this.userModel.findOne({
      _id: new Types.ObjectId(customerId),
      role: UserRole.CUSTOMER,
      isDeleted: false,
    });

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }
    if (addressIndex < 0 || addressIndex >= customer.addresses.length) {
      throw new BadRequestException('Chi so dia chi khong hop le');
    }

    const wasDefault = customer.addresses[addressIndex].isDefault;
    customer.addresses.splice(addressIndex, 1);

    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }

    return customer.save();
  }

  // ===== DAT DIA CHI MAC DINH =====
  async setDefaultAddress(customerId: string, addressIndex: number): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    const customer = await this.userModel.findOne({
      _id: new Types.ObjectId(customerId),
      role: UserRole.CUSTOMER,
      isDeleted: false,
    });

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }
    if (addressIndex < 0 || addressIndex >= customer.addresses.length) {
      throw new BadRequestException('Chi so dia chi khong hop le');
    }

    customer.addresses.forEach((addr, i) => {
      addr.isDefault = i === addressIndex;
    });

    return customer.save();
  }

  // ===== CONG DIEM LOYALTY =====
  async addLoyaltyPoints(
    customerId: string,
    points: number,
    reason: string,
  ): Promise<{ loyaltyPoints: number }> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    const customer = await this.userModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(customerId), role: UserRole.CUSTOMER, isDeleted: false },
        { $inc: { loyaltyPoints: points } },
        { new: true },
      )
      .select('loyaltyPoints');

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    console.log(`[Loyalty] +${points} diem cho customer ${customerId}: ${reason}`);
    return { loyaltyPoints: customer.loyaltyPoints };
  }

  // ===== TRU DIEM LOYALTY =====
  async deductLoyaltyPoints(
    customerId: string,
    points: number,
    reason: string,
  ): Promise<{ loyaltyPoints: number }> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    const customer = await this.userModel.findOne({
      _id: new Types.ObjectId(customerId),
      role: UserRole.CUSTOMER,
      isDeleted: false,
    });

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }
    if (customer.loyaltyPoints < points) {
      throw new BadRequestException(
        `Khong du diem. Hien co: ${customer.loyaltyPoints}, can tru: ${points}`,
      );
    }

    customer.loyaltyPoints -= points;
    await customer.save();

    console.log(`[Loyalty] -${points} diem cho customer ${customerId}: ${reason}`);
    return { loyaltyPoints: customer.loyaltyPoints };
  }

  // ===== LICH SU DIEM LOYALTY =====
  async getLoyaltyHistory(customerId: string): Promise<any[]> {
    // Placeholder - will be implemented with LoyaltyHistory collection in future
    return [];
  }

  // ===== LICH SU DON HANG CUA KHACH =====
  async getOrderHistory(
    customerId: string,
    query: { page?: number; limit?: number },
  ): Promise<{
    items: OrderDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter = {
      customerId: new Types.ObjectId(customerId),
      isDeleted: false,
    };

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      items: items as OrderDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===== TOP KHACH HANG THEO TONG CHI TIEU =====
  async getTopCustomers(limit: number = 10): Promise<any[]> {
    return this.orderModel.aggregate([
      {
        $match: {
          isDeleted: false,
          status: { $nin: ['cancelled', 'returned'] },
        },
      },
      {
        $group: {
          _id: '$customerId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      {
        $project: {
          _id: '$customer._id',
          fullName: '$customer.fullName',
          phone: '$customer.phone',
          email: '$customer.email',
          avatar: '$customer.avatar',
          loyaltyPoints: '$customer.loyaltyPoints',
          totalOrders: 1,
          totalSpent: 1,
          lastOrderDate: 1,
        },
      },
    ]);
  }

  // ===== THONG KE KHACH HANG =====
  async getCustomerStats(customerId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderDate: Date | null;
  }> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    const stats = await this.orderModel.aggregate([
      {
        $match: {
          customerId: new Types.ObjectId(customerId),
          isDeleted: false,
          status: { $nin: ['cancelled'] },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    if (stats.length === 0) {
      return { totalOrders: 0, totalSpent: 0, avgOrderValue: 0, lastOrderDate: null };
    }

    return {
      totalOrders: stats[0].totalOrders,
      totalSpent: stats[0].totalSpent,
      avgOrderValue: Math.round(stats[0].avgOrderValue),
      lastOrderDate: stats[0].lastOrderDate,
    };
  }
}
