"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AppGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let AppGateway = AppGateway_1 = class AppGateway {
    constructor(jwt, config, prisma) {
        this.jwt = jwt;
        this.config = config;
        this.prisma = prisma;
        this.logger = new common_1.Logger(AppGateway_1.name);
        this.userSockets = new Map();
        this.driverSockets = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token;
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwt.verify(token, {
                secret: this.config.get('JWT_ACCESS_SECRET'),
            });
            client.userId = payload.sub;
            client.userRole = payload.role;
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
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.userId)
            this.userSockets.delete(client.userId);
        if (client.driverId) {
            this.driverSockets.delete(client.driverId);
            this.prisma.driver.updateMany({
                where: { id: client.driverId },
                data: { availability: 'OFFLINE' },
            }).catch(() => { });
        }
        this.logger.log(`Client déconnecté: ${client.userId}`);
    }
    async handleDriverLocation(client, data) {
        if (!client.driverId)
            return;
        await this.prisma.driver.update({
            where: { id: client.driverId },
            data: {
                latitude: data.lat,
                longitude: data.lng,
                heading: data.heading,
                lastLocationAt: new Date(),
            },
        });
        if (data.rideId) {
            this.server.to(`ride:${data.rideId}`).emit('driver:location', {
                lat: data.lat,
                lng: data.lng,
                heading: data.heading,
            });
        }
    }
    handleJoinRide(client, data) {
        client.join(`ride:${data.rideId}`);
        this.logger.log(`User ${client.userId} a rejoint la room ride:${data.rideId}`);
    }
    async handleChatMessage(client, data) {
        if (!client.userId)
            return;
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
        this.server.to(`ride:${data.rideId}`).emit('chat:message', message);
    }
    async handleDriverAvailability(client, data) {
        if (!client.driverId)
            return;
        await this.prisma.driver.update({
            where: { id: client.driverId },
            data: { availability: data.availability },
        });
        client.emit('driver:availability:updated', data);
    }
    emitToUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
    emitToDriver(driverId, event, data) {
        this.server.to(`driver:${driverId}`).emit(event, data);
    }
    broadcastToOnlineDrivers(event, data) {
        this.driverSockets.forEach((socketId) => {
            this.server.to(socketId).emit(event, data);
        });
    }
};
exports.AppGateway = AppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AppGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('driver:location'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleDriverLocation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ride:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleJoinRide", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleChatMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('driver:availability'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleDriverAvailability", null);
exports.AppGateway = AppGateway = AppGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], AppGateway);
//# sourceMappingURL=websocket.gateway.js.map