// src/common/websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  driverId?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(AppGateway.name);

  // Map userId → socketId pour cibler les notifications
  private userSockets = new Map<string, string>();
  private driverSockets = new Map<string, string>();

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ─── Connexion ────────────────────────────────────────────────────────────
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token as string;
      if (!token) { client.disconnect(); return; }

      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      }) as any;

      client.userId = payload.sub;
      client.userRole = payload.role;

      // Récupérer l'ID chauffeur si applicable
      if (payload.role === 'DRIVER') {
        const driver = await this.prisma.driver.findUnique({
          where: { userId: payload.sub },
          select: { id: true },
        });
        if (driver) {
          client.driverId = driver.id;
          this.driverSockets.set(driver.id, client.id);
          client.join(`driver:${driver.id}`);
        }
      }

      this.userSockets.set(payload.sub, client.id);
      client.join(`user:${payload.sub}`);

      this.logger.log(`Client connecté: ${payload.sub} (${payload.role})`);
    } catch {
      client.disconnect();
    }
  }

  // ─── Déconnexion ──────────────────────────────────────────────────────────
  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) this.userSockets.delete(client.userId);
    if (client.driverId) {
      this.driverSockets.delete(client.driverId);
      // Passer le chauffeur hors ligne
      this.prisma.driver.updateMany({
        where: { id: client.driverId },
        data: { availability: 'OFFLINE' },
      }).catch(() => {});
    }
    this.logger.log(`Client déconnecté: ${client.userId}`);
  }

  // ─── GPS Driver → Server ──────────────────────────────────────────────────
  @SubscribeMessage('driver:location')
  async handleDriverLocation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { lat: number; lng: number; heading?: number; rideId?: string },
  ) {
    if (!client.driverId) return;

    // Mettre à jour la position en base
    await this.prisma.driver.update({
      where: { id: client.driverId },
      data: {
        latitude: data.lat,
        longitude: data.lng,
        heading: data.heading,
        lastLocationAt: new Date(),
      },
    });

    // Transmettre au passager si une course est active
    if (data.rideId) {
      this.server.to(`ride:${data.rideId}`).emit('driver:location', {
        lat: data.lat,
        lng: data.lng,
        heading: data.heading,
      });
    }
  }

  // ─── Rejoindre une room de course ─────────────────────────────────────────
  @SubscribeMessage('ride:join')
  handleJoinRide(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { rideId: string },
  ) {
    client.join(`ride:${data.rideId}`);
    this.logger.log(`User ${client.userId} a rejoint la room ride:${data.rideId}`);
  }

  // ─── Chat message ─────────────────────────────────────────────────────────
  @SubscribeMessage('chat:message')
  async handleChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { rideId: string; content: string },
  ) {
    if (!client.userId) return;

    const message = await this.prisma.message.create({
      data: {
        rideId: data.rideId,
        senderId: client.userId,
        content: data.content,
        type: 'TEXT',
      },
      include: {
        sender: { select: { id: true, firstName: true, avatarUrl: true } },
      },
    });

    // Broadcast à tous les participants de la course
    this.server.to(`ride:${data.rideId}`).emit('chat:message', message);
  }

  // ─── Driver: passer en ligne/hors ligne ───────────────────────────────────
  @SubscribeMessage('driver:availability')
  async handleDriverAvailability(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { availability: 'ONLINE' | 'OFFLINE' },
  ) {
    if (!client.driverId) return;
    await this.prisma.driver.update({
      where: { id: client.driverId },
      data: { availability: data.availability },
    });
    client.emit('driver:availability:updated', data);
  }

  // ─── Méthodes utilitaires pour émettre depuis d'autres services ───────────

  // Notifier le passager d'un changement de statut
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Notifier un chauffeur d'une nouvelle course
  emitToDriver(driverId: string, event: string, data: any) {
    this.server.to(`driver:${driverId}`).emit(event, data);
  }

  // Broadcast à tous les chauffeurs en ligne
  broadcastToOnlineDrivers(event: string, data: any) {
    this.driverSockets.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });
  }
}
