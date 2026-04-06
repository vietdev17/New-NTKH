import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ShipperLocation,
  ShipperLocationDocument,
  ShipperStatus,
} from './schemas/shipper-location.schema';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class ShipperLocationService {
  constructor(
    @InjectModel(ShipperLocation.name)
    private locationModel: Model<ShipperLocationDocument>,
  ) {}

  // ===== CẬP NHẬT VỊ TRÍ GPS =====
  async updateLocation(
    shipperId: string,
    dto: UpdateLocationDto,
  ): Promise<ShipperLocationDocument> {
    const shipperObjId = new Types.ObjectId(shipperId);

    let location = await this.locationModel.findOne({ shipperId: shipperObjId });

    if (!location) {
      location = await this.locationModel.create({
        shipperId: shipperObjId,
        location: {
          type: 'Point',
          coordinates: [dto.lng, dto.lat],
        },
        accuracy: dto.accuracy || null,
        currentOrderId: dto.currentOrderId
          ? new Types.ObjectId(dto.currentOrderId)
          : null,
        status: ShipperStatus.AVAILABLE,
      });
    } else {
      location.location = {
        type: 'Point',
        coordinates: [dto.lng, dto.lat],
      };
      location.accuracy = dto.accuracy || null;
      location.currentOrderId = dto.currentOrderId
        ? new Types.ObjectId(dto.currentOrderId)
        : null;
      location.updatedAt = new Date();
      await location.save();
    }

    return location;
  }

  // ===== LẤY VỊ TRÍ HIỆN TẠI CỦA SHIPPER =====
  async getLocation(
    shipperId: string,
  ): Promise<ShipperLocationDocument> {
    const location = await this.locationModel
      .findOne({
        shipperId: new Types.ObjectId(shipperId),
      })
      .exec();

    if (!location) {
      throw new NotFoundException(
        'Không tìm thấy vị trí của shipper',
      );
    }

    return location;
  }

  // ===== TÌM SHIPPER GẦN VỊ TRÍ (2DSPHERE QUERY) =====
  async getNearbyShippers(
    lat: number,
    lng: number,
    radiusKm: number = 5,
  ): Promise<any[]> {
    const radiusInMeters = radiusKm * 1000;

    const shippers = await this.locationModel
      .find({
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: radiusInMeters,
          },
        },
        status: { $in: [ShipperStatus.AVAILABLE] },
      })
      .populate('shipperId', 'fullName phone avatar')
      .lean();

    return shippers.map((s) => {
      const [shipperLng, shipperLat] = s.location.coordinates;
      const distance = this.calculateDistance(
        lat,
        lng,
        shipperLat,
        shipperLng,
      );
      return {
        ...s,
        distanceKm: Math.round(distance * 100) / 100,
      };
    });
  }

  // ===== ADMIN: TẤT CẢ VỊ TRÍ SHIPPER ĐANG HOẠT ĐỘNG =====
  async getAllActiveLocations() {
    return this.locationModel
      .find({
        status: { $ne: ShipperStatus.OFFLINE },
      })
      .populate('shipperId', 'fullName phone avatar')
      .lean();
  }

  // ===== CẬP NHẬT TRẠNG THÁI KHẢ DỤNG =====
  async updateStatus(
    shipperId: string,
    status: ShipperStatus,
  ): Promise<ShipperLocationDocument> {
    const shipperObjId = new Types.ObjectId(shipperId);

    let location = await this.locationModel.findOne({ shipperId: shipperObjId });

    if (!location) {
      location = await this.locationModel.create({
        shipperId: shipperObjId,
        location: { type: 'Point', coordinates: [0, 0] },
        status,
      });
    } else {
      location.status = status;
      location.updatedAt = new Date();
      await location.save();
    }

    return location;
  }

  // ----- Hàm tính khoảng cách (Haversine formula) -----
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
