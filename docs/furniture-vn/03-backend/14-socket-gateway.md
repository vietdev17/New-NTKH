# SOCKET.IO GATEWAY

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> WebSocket gateway cho realtime: thong bao, theo doi don hang, vi tri shipper
> Su dung Socket.IO voi JWT authentication, room-based broadcasting
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Tong quan](#1-tong-quan)
2. [Cau truc module](#2-cau-truc-module)
3. [EventsGateway](#3-eventsgateway)
4. [Room naming convention](#4-room-naming-convention)
5. [Server-emitted events](#5-server-emitted-events)
6. [Client-emitted events](#6-client-emitted-events)
7. [Payload interfaces](#7-payload-interfaces)
8. [Frontend useSocket hook](#8-frontend-usesocket-hook)
9. [Vi du su dung](#9-vi-du-su-dung)

---

## 1. Tong quan

Socket.IO Gateway phuc vu cac tinh nang realtime:

- **Thong bao**: Push notification tuc thi toi user
- **Theo doi don hang**: Cap nhat trang thai don hang realtime
- **Vi tri shipper**: Broadcast GPS shipper len ban do (admin + customer)
- **Admin dashboard**: Nhan event khi co don moi, review moi, tra hang, het hang
- **POS**: Dong bo don hang POS voi admin

**Kien truc:**
- Namespace: `/` (root)
- Authentication: JWT token truyen qua handshake `auth.token`
- Room-based: Moi user join room theo role va context
- CORS: Cho phep frontend origin

---

## 2. Cau truc module

```
apps/api/src/modules/socket/
├── socket.module.ts
├── events.gateway.ts
└── interfaces/
    ├── socket-events.interface.ts
    └── shipper-location.interface.ts
```

### Module Registration

```typescript
// socket.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class SocketModule {}
```

---

## 3. EventsGateway

```typescript
// events.gateway.ts
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
import { Logger } from '@nestjs/common';
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
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private authService: AuthService) {}

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

      // FIXED: Su dung AuthService.verifyToken() thay vi tu decode
      const user = await this.authService.verifyToken(token);

      if (!user) {
        this.logger.warn(`Client ${client.id} token khong hop le`);
        client.disconnect();
        return;
      }

      // Gan user info vao socket
      client.user = {
        _id: user._id.toString(),
        role: user.role,
        name: user.name,
      };

      // Tu dong join room theo role
      client.join(`room:customer:${user._id}`);

      if (user.role === 'admin') {
        client.join('room:admin');
      }

      if (user.role === 'shipper') {
        client.join('room:shippers');
        client.join(`room:shipper:${user._id}`);
      }

      this.logger.log(
        `Client connected: ${client.id} | User: ${user.name} (${user.role})`,
      );
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Khi client ngat ket noi:
   * - Tu dong leave tat ca room
   * - Neu la shipper, cap nhat trang thai offline
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
      latitude: number;
      longitude: number;
      currentOrderId?: string;
    },
  ) {
    if (!client.user || client.user.role !== 'shipper') {
      return { error: 'Chi shipper moi duoc cap nhat vi tri' };
    }

    const payload = {
      shipperId: client.user._id,
      shipperName: client.user.name,
      latitude: data.latitude,
      longitude: data.longitude,
      currentOrderId: data.currentOrderId,
      timestamp: new Date().toISOString(),
    };

    // Broadcast toi admin
    this.server.to('room:admin').emit('shipper:location_updated', payload);

    // Broadcast toi room cua don hang dang giao
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
}
```

---

## 4. Room naming convention

| Room | Mo ta | Ai join |
|------|-------|---------|
| `room:admin` | Tat ca admin | Admin (auto join khi connect) |
| `room:shippers` | Tat ca shipper | Shipper (auto join khi connect) |
| `room:order:{orderId}` | Theo doi 1 don hang cu the | Customer, shipper duoc assign, admin |
| `room:customer:{customerId}` | Thong bao cho 1 customer | Customer (auto join bang userId) |
| `room:shipper:{shipperId}` | Thong bao cho 1 shipper | Shipper (auto join khi connect) |

**Quy tac:**
- Room luon bat dau bang prefix `room:`
- Auto join: `room:admin`, `room:shippers`, `room:customer:{id}`, `room:shipper:{id}` duoc join tu dong khi connect
- Manual join: `room:order:{id}` can goi event `join_room` tu client

---

## 5. Server-emitted events

| Event | Rooms | Khi nao | Payload |
|-------|-------|---------|---------|
| `order:created` | `room:admin`, `room:customer:{customerId}` | Tao don hang moi | OrderCreatedPayload |
| `order:status_updated` | `room:admin`, `room:order:{orderId}`, `room:customer:{customerId}` | Trang thai don thay doi | OrderStatusPayload |
| `order:assigned` | `room:shipper:{shipperId}`, `room:order:{orderId}`, `room:customer:{customerId}` | Gan shipper cho don | OrderAssignedPayload |
| `shipper:location_updated` | `room:order:{orderId}`, `room:admin` | Shipper gui GPS | ShipperLocationPayload |
| `shipper:status_changed` | `room:admin` | Shipper doi trang thai / disconnect | ShipperStatusPayload |
| `notification` | `room:customer:{userId}` | Thong bao ca nhan | NotificationPayload |
| `pos:order_created` | `room:admin` | Tao don tu POS | OrderCreatedPayload |
| `review:new` | `room:admin` | Co danh gia moi | ReviewPayload |
| `return:requested` | `room:admin` | Yeu cau tra hang | ReturnPayload |
| `stock:low` | `room:admin` | San pham sap het hang | StockAlertPayload |

---

## 6. Client-emitted events

| Event | Payload | Mo ta |
|-------|---------|-------|
| `join_room` | `string` (room name) | Yeu cau join room (VD: `room:order:abc123`) |
| `leave_room` | `string` (room name) | Yeu cau leave room |
| `shipper:update_location` | `{ latitude, longitude, currentOrderId? }` | Gui vi tri GPS (chi shipper) |
| `shipper:update_status` | `{ status: 'online' \| 'offline' \| 'delivering' }` | Cap nhat trang thai (chi shipper) |

---

## 7. Payload interfaces

```typescript
// interfaces/socket-events.interface.ts

export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  channel: 'web' | 'pos';
  createdAt: string;
}

export interface OrderStatusPayload {
  orderId: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
}

export interface OrderAssignedPayload {
  orderId: string;
  orderNumber: string;
  shippingAddress: {
    fullAddress: string;
    province: string;
  };
}

export interface ShipperLocationPayload {
  shipperId: string;
  shipperName: string;
  latitude: number;
  longitude: number;
  currentOrderId?: string;
  timestamp: string;
}

export interface ShipperStatusPayload {
  shipperId: string;
  name: string;
  status: 'online' | 'offline' | 'delivering';
  timestamp: string;
}

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  createdAt: string;
}

export interface ReviewPayload {
  reviewId: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  customerName: string;
}

export interface ReturnPayload {
  returnId: string;
  orderId: string;
  reason: string;
  createdAt: string;
}

export interface StockAlertPayload {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  color?: string;
  dimension?: string;
}
```

```typescript
// interfaces/shipper-location.interface.ts

export interface ShipperLocationUpdate {
  latitude: number;
  longitude: number;
  currentOrderId?: string;
}

export interface ShipperStatusUpdate {
  status: 'online' | 'offline' | 'delivering';
}
```

---

## 8. Frontend useSocket hook

```typescript
// hooks/useSocket.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UseSocketOptions {
  autoConnect?: boolean;
  rooms?: string[];
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, rooms = [] } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Khoi tao ket noi
  const connect = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', socket.id);

      // Auto join rooms
      rooms.forEach((room) => {
        socket.emit('join_room', room);
      });
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socketRef.current = socket;
    return socket;
  }, [rooms]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Join room
  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit('join_room', room);
  }, []);

  // Leave room
  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit('leave_room', room);
  }, []);

  // Lang nghe event voi cleanup tu dong
  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socketRef.current?.on(event, callback);
      // Tra ve ham cleanup
      return () => {
        socketRef.current?.off(event, callback);
      };
    },
    [],
  );

  // Gui event
  const emit = useCallback(
    (event: string, data?: any) => {
      socketRef.current?.emit(event, data);
    },
    [],
  );

  // Auto connect/disconnect theo lifecycle
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    on,
    emit,
  };
}
```

### Vi du su dung useSocket trong component

```typescript
// components/OrderTracking.tsx
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { ShipperLocationPayload, OrderStatusPayload } from '@/types/socket';

export function OrderTracking({ orderId }: { orderId: string }) {
  const { on, joinRoom, leaveRoom, isConnected } = useSocket();
  const [shipperLocation, setShipperLocation] = useState<ShipperLocationPayload | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('');

  useEffect(() => {
    // Join room theo doi don hang nay
    joinRoom(`room:order:${orderId}`);

    // Lang nghe vi tri shipper
    const offLocation = on('shipper:location_updated', (data: ShipperLocationPayload) => {
      setShipperLocation(data);
    });

    // Lang nghe trang thai don hang
    const offStatus = on('order:status_updated', (data: OrderStatusPayload) => {
      setOrderStatus(data.newStatus);
    });

    return () => {
      offLocation();
      offStatus();
      leaveRoom(`room:order:${orderId}`);
    };
  }, [orderId, on, joinRoom, leaveRoom]);

  return (
    <div>
      <p>Trang thai ket noi: {isConnected ? 'Da ket noi' : 'Mat ket noi'}</p>
      <p>Trang thai don hang: {orderStatus}</p>
      {shipperLocation && (
        <p>
          Vi tri shipper: {shipperLocation.latitude}, {shipperLocation.longitude}
        </p>
      )}
    </div>
  );
}
```

---

## 9. Vi du su dung

### Ket noi tu client (browser)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token: 'eyJhbGciOiJIUzI1NiIs...' },
  transports: ['websocket', 'polling'],
});

// Ket noi thanh cong
socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  // Join room theo doi don hang
  socket.emit('join_room', 'room:order:661a1b2c3d4e5f6a7b8c9d10');
});

// Nhan thong bao
socket.on('notification', (data) => {
  console.log('Notification:', data);
  // { id: '...', title: 'Don hang da duoc tao', message: '...', type: 'order', createdAt: '...' }
});

// Nhan cap nhat trang thai don hang
socket.on('order:status_updated', (data) => {
  console.log('Order status:', data);
  // { orderId: '...', orderNumber: 'FV-20260402-0001', oldStatus: 'confirmed', newStatus: 'shipping' }
});

// Nhan vi tri shipper (khi dang theo doi don hang)
socket.on('shipper:location_updated', (data) => {
  console.log('Shipper location:', data);
  // { shipperId: '...', shipperName: 'Nguyen Van A', latitude: 10.7769, longitude: 106.7009, timestamp: '...' }
});
```

### Shipper gui vi tri

```javascript
// Shipper app gui vi tri moi 10 giay
setInterval(() => {
  navigator.geolocation.getCurrentPosition((pos) => {
    socket.emit('shipper:update_location', {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      currentOrderId: '661a1b2c3d4e5f6a7b8c9d10',
    });
  });
}, 10000);

// Shipper cap nhat trang thai
socket.emit('shipper:update_status', { status: 'delivering' });
```

### Server-side emit (tu cac service khac)

```typescript
// Trong OrdersService - khi cap nhat trang thai don hang:
this.eventsGateway.server
  .to(`room:order:${order._id}`)
  .to(`room:customer:${order.customer}`)
  .to('room:admin')
  .emit('order:status_updated', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    oldStatus: 'confirmed',
    newStatus: 'shipping',
  });
```
