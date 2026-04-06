import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, forwardRef, Inject } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

interface AuthenticatedSocket extends Socket {
  user?: {
    _id: string;
    role: string;
    name: string;
  };
}

@WebSocketGateway({
  namespace: '/',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  // ============================================================
  // Connection handling
  // ============================================================

  /**
   * Khi client ket noi:
   * 1. Verify JWT token tu handshake
   * 2. Gan user info vao socket
   * 3. Tu dong join room theo role
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} ket noi khong co token`);
        client.disconnect();
        return;
      }

      // CRITICAL FIX: Su dung AuthService.verifyToken() thay vi tu decode
      const payload = await this.authService.verifyToken(token);

      if (!payload) {
        this.logger.warn(`Client ${client.id} token khong hop le`);
        client.disconnect();
        return;
      }

      // Gan user info vao socket
      client.user = {
        _id: payload.sub,
        role: payload.role,
        name: payload.email,
      };

      // Tu dong join room theo role
      client.join(`room:customer:${payload.sub}`);

      if (payload.role === 'admin') {
        client.join('room:admin');
      }

      if (payload.role === 'shipper') {
        client.join('room:shippers');
        client.join(`room:shipper:${payload.sub}`);
      }

      this.logger.log(
        `Client connected: ${client.id} | User: ${payload.email} (${payload.role})`,
      );
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Khi client ngat ket noi:
   * - Tu dong leave tat ca room
   * - Neu la shipper, thong bao admin ve trang thai offline
   */
  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.logger.log(
        `Client disconnected: ${client.id} | User: ${client.user.name}`,
      );

      // Neu la shipper, thong bao admin ve trang thai offline
      if (client.user.role === 'shipper') {
        this.server.to('room:admin').emit('shipper:status_changed', {
          shipperId: client.user._id,
          name: client.user.name,
          status: 'offline',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  // ============================================================
  // Client-emitted events
  // ============================================================

  /**
   * Client yeu cau join room cu the
   * VD: join room theo doi 1 don hang
   */
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: string,
  ) {
    if (!client.user) return;

    // Validate: chi cho phep join room hop le
    const allowedPrefixes = ['room:order:', 'room:customer:', 'room:shipper:'];
    const isAdmin = client.user.role === 'admin';
    const isValidRoom = allowedPrefixes.some((prefix) => room.startsWith(prefix));

    if (!isAdmin && !isValidRoom) {
      return { error: 'Khong co quyen join room nay' };
    }

    client.join(room);
    this.logger.log(`${client.user.name} joined ${room}`);
    return { success: true, room };
  }

  /**
   * Client yeu cau leave room
   */
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: string,
  ) {
    if (!client.user) return;
    client.leave(room);
    this.logger.log(`${client.user.name} left ${room}`);
    return { success: true, room };
  }

  /**
   * Shipper gui cap nhat vi tri GPS
   * Broadcast toi room cua don hang dang giao + admin
   */
  @SubscribeMessage('shipper:update_location')
  handleShipperLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      lat?: number;
      lng?: number;
      latitude?: number;
      longitude?: number;
      currentOrderId?: string;
    },
  ) {
    if (!client.user || client.user.role !== 'shipper') {
      return { error: 'Chỉ shipper mới được cập nhật vị trí' };
    }

    // Hỗ trợ cả 2 format: lat/lng và latitude/longitude
    const lat = data.lat ?? data.latitude;
    const lng = data.lng ?? data.longitude;

    if (!lat || !lng) {
      return { error: 'Thiếu tọa độ lat/lng' };
    }

    const payload = {
      shipperId: client.user._id,
      shipperName: client.user.name,
      lat,
      lng,
      currentOrderId: data.currentOrderId,
      timestamp: new Date().toISOString(),
    };

    // Broadcast tới admin
    this.server.to('room:admin').emit('shipper:location_updated', payload);

    // Broadcast tới room của đơn hàng đang giao
    if (data.currentOrderId) {
      this.server
        .to(`room:order:${data.currentOrderId}`)
        .emit('shipper:location_updated', payload);
    }

    return { success: true };
  }

  /**
   * Shipper cap nhat trang thai (online/offline/delivering)
   */
  @SubscribeMessage('shipper:update_status')
  handleShipperStatusUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status: 'online' | 'offline' | 'delivering' },
  ) {
    if (!client.user || client.user.role !== 'shipper') {
      return { error: 'Chi shipper moi duoc cap nhat trang thai' };
    }

    this.server.to('room:admin').emit('shipper:status_changed', {
      shipperId: client.user._id,
      name: client.user.name,
      status: data.status,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  // ============================================================
  // Server helper methods
  // ============================================================

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`room:customer:${userId}`).emit(event, data);
  }

  sendToOrder(orderId: string, event: string, data: any) {
    this.server.to(`room:order:${orderId}`).emit(event, data);
  }

  sendToAdmin(event: string, data: any) {
    this.server.to('room:admin').emit(event, data);
  }

  sendToShipper(shipperId: string, event: string, data: any) {
    this.server.to(`room:shipper:${shipperId}`).emit(event, data);
  }
}
