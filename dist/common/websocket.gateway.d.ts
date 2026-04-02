import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
    driverId?: string;
}
export declare class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwt;
    private config;
    private prisma;
    server: Server;
    private readonly logger;
    private userSockets;
    private driverSockets;
    constructor(jwt: JwtService, config: ConfigService, prisma: PrismaService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleDriverLocation(client: AuthenticatedSocket, data: {
        lat: number;
        lng: number;
        heading?: number;
        rideId?: string;
    }): Promise<void>;
    handleJoinRide(client: AuthenticatedSocket, data: {
        rideId: string;
    }): void;
    handleChatMessage(client: AuthenticatedSocket, data: {
        rideId: string;
        content: string;
    }): Promise<void>;
    handleDriverAvailability(client: AuthenticatedSocket, data: {
        availability: 'ONLINE' | 'OFFLINE';
    }): Promise<void>;
    emitToUser(userId: string, event: string, data: any): void;
    emitToDriver(driverId: string, event: string, data: any): void;
    broadcastToOnlineDrivers(event: string, data: any): void;
}
export {};
