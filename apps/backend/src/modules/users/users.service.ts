import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { User, UserDocument, UserRole, ShipperStatus } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PaginatedResponse, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ============================================================
  // AUTH SERVICE METHODS (backward compat - used by AuthService)
  // ============================================================

  async findById(id: string): Promise<UserDocument | null> {
    if (!id || !Types.ObjectId.isValid(id)) return null;
    return this.userModel
      .findOne({ _id: id, isDeleted: false })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec() as any;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), isDeleted: false })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec() as any;
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .lean()
      .exec() as any;
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ phone, isDeleted: false })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec() as any;
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ googleId, isDeleted: false })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec() as any;
  }

  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(id)
      .select('+refreshToken')
      .lean()
      .exec() as any;
  }

  async findByResetToken(hashedToken: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
        isDeleted: false,
      })
      .select('+resetPasswordToken +resetPasswordExpires')
      .lean()
      .exec() as any;
  }

  // ============================================================
  // ADMIN CRUD METHODS
  // ============================================================

  async findAll(query: QueryUserDto): Promise<PaginatedResponse<UserDocument>> {
    const { page = 1, limit = 12, role, isActive, includeDeleted, search } = query;
    const filter: FilterQuery<User> = {};

    if (!includeDeleted) {
      filter.isDeleted = false;
    }
    if (role) {
      filter.role = role;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return paginate(items as UserDocument[], total, page, limit);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(dto: CreateUserDto | Record<string, any>): Promise<UserDocument> {
    // Check email uniqueness
    const existingEmail = await this.userModel.findOne({
      email: (dto.email as string).toLowerCase(),
    });
    if (existingEmail) {
      throw new ConflictException('Email da duoc su dung');
    }

    // Check phone uniqueness if provided
    if (dto.phone) {
      const existingPhone = await this.userModel.findOne({
        phone: dto.phone,
        isDeleted: false,
      });
      if (existingPhone) {
        throw new ConflictException('So dien thoai da duoc su dung');
      }
    }

    const user = new this.userModel({
      ...dto,
      email: (dto.email as string).toLowerCase(),
      role: (dto as any).role || UserRole.CUSTOMER,
      isActive: (dto as any).isActive ?? true,
    });

    const saved = await user.save();
    this.logger.log(`User created: ${saved.email} (role: ${saved.role})`);
    return this.findById(saved._id.toString());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async update(id: string, dto: Record<string, any>): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    if (dto.phone) {
      const existingPhone = await this.userModel.findOne({
        phone: dto.phone,
        _id: { $ne: id },
        isDeleted: false,
      });
      if (existingPhone) {
        throw new ConflictException('So dien thoai da duoc su dung');
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    this.logger.log(`User updated: ${updatedUser.email}`);
    return updatedUser as UserDocument;
  }

  async softDelete(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }
    if (user.isDeleted) {
      throw new BadRequestException('Nguoi dung da bi xoa truoc do');
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isActive = false;
    user.refreshToken = null;
    await user.save();

    this.logger.log(`User soft-deleted: ${user.email}`);
    return this.findById(id);
  }

  async changeRole(id: string, role: UserRole): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    const user = await this.userModel.findOne({ _id: id, isDeleted: false });
    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Khong the thay doi role cua admin khac');
    }

    if (role === UserRole.SHIPPER && user.role !== UserRole.SHIPPER) {
      user.status = ShipperStatus.OFFLINE;
    }
    if (user.role === UserRole.SHIPPER && role !== UserRole.SHIPPER) {
      user.status = null;
      user.vehicleType = null;
      user.licensePlate = null;
    }

    user.role = role;
    await user.save();
    this.logger.log(`User role changed: ${user.email} -> ${role}`);
    return this.findById(id);
  }

  async getStaff(): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: { $in: [UserRole.STAFF, UserRole.MANAGER] }, isDeleted: false })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .sort({ role: 1, fullName: 1 })
      .lean()
      .exec() as Promise<UserDocument[]>;
  }

  async getShippers(): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: UserRole.SHIPPER, isDeleted: false })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .sort({ isActive: -1, status: 1, fullName: 1 })
      .lean()
      .exec() as Promise<UserDocument[]>;
  }

  async activateShipper(id: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: id,
      role: UserRole.SHIPPER,
      isDeleted: false,
    });
    if (!user) {
      throw new NotFoundException('Shipper khong ton tai');
    }
    if (user.isActive) {
      throw new BadRequestException('Shipper da duoc kich hoat');
    }

    user.isActive = true;
    user.status = ShipperStatus.OFFLINE;
    await user.save();
    this.logger.log(`Shipper activated: ${user.email}`);
    return this.findById(id);
  }

  async deactivateShipper(id: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: id,
      role: UserRole.SHIPPER,
      isDeleted: false,
    });
    if (!user) {
      throw new NotFoundException('Shipper khong ton tai');
    }
    if (!user.isActive) {
      throw new BadRequestException('Shipper da bi vo hieu hoa');
    }

    user.isActive = false;
    user.status = ShipperStatus.OFFLINE;
    user.refreshToken = null;
    await user.save();
    this.logger.log(`Shipper deactivated: ${user.email}`);
    return this.findById(id);
  }

  // Legacy delete method (kept for compatibility)
  async delete(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
      .exec();
  }

  // ===== ADDRESS MANAGEMENT (by _id, for logged-in user) =====

  async addAddress(userId: string, dto: any): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User khong ton tai');

    const newAddr: any = {
      _id: new Types.ObjectId(),
      ...dto,
      isDefault: dto.isDefault || user.addresses.length === 0,
    };

    if (newAddr.isDefault) {
      user.addresses.forEach((a: any) => (a.isDefault = false));
    }

    user.addresses.push(newAddr);
    await user.save();
    return user;
  }

  async updateAddress(userId: string, addressId: string, dto: any): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User khong ton tai');

    const idx = user.addresses.findIndex((a: any) => a._id.toString() === addressId);
    if (idx === -1) throw new NotFoundException('Dia chi khong ton tai');

    if (dto.isDefault) {
      user.addresses.forEach((a: any) => (a.isDefault = false));
    }
    Object.assign(user.addresses[idx], dto);
    await user.save();
    return user;
  }

  async deleteAddress(userId: string, addressId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User khong ton tai');

    const idx = user.addresses.findIndex((a: any) => a._id.toString() === addressId);
    if (idx === -1) throw new NotFoundException('Dia chi khong ton tai');

    const wasDefault = (user.addresses[idx] as any).isDefault;
    user.addresses.splice(idx, 1);
    if (wasDefault && user.addresses.length > 0) {
      (user.addresses[0] as any).isDefault = true;
    }
    await user.save();
    return user;
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User khong ton tai');

    const idx = user.addresses.findIndex((a: any) => a._id.toString() === addressId);
    if (idx === -1) throw new NotFoundException('Dia chi khong ton tai');

    user.addresses.forEach((a: any, i: number) => (a.isDefault = i === idx));
    await user.save();
    return user;
  }
}
