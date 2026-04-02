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
var RidesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RidesService = exports.UpdateRideStatusDto = exports.CreateRideDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateRideDto {
}
exports.CreateRideDto = CreateRideDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRideDto.prototype, "pickupAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRideDto.prototype, "pickupLat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRideDto.prototype, "pickupLng", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRideDto.prototype, "dropoffAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRideDto.prototype, "dropoffLat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRideDto.prototype, "dropoffLng", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.VehicleType }),
    (0, class_validator_1.IsEnum)(client_1.VehicleType),
    __metadata("design:type", String)
], CreateRideDto.prototype, "vehicleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PaymentMethod }),
    (0, class_validator_1.IsEnum)(client_1.PaymentMethod),
    __metadata("design:type", String)
], CreateRideDto.prototype, "paymentMethod", void 0);
class UpdateRideStatusDto {
}
exports.UpdateRideStatusDto = UpdateRideStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RideStatus }),
    (0, class_validator_1.IsEnum)(client_1.RideStatus),
    __metadata("design:type", String)
], UpdateRideStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRideStatusDto.prototype, "cancelReason", void 0);
let RidesService = RidesService_1 = class RidesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RidesService_1.name);
    }
    calculatePrice(distanceKm, vehicleType) {
        const baseRates = {
            BERLINE: 1.8,
            SUV: 2.2,
            VAN: 2.8,
            MOTO: 1.2,
            LUXE: 3.5,
        };
        const baseFare = {
            BERLINE: 3.0,
            SUV: 4.0,
            VAN: 5.0,
            MOTO: 2.0,
            LUXE: 8.0,
        };
        return Math.max(baseFare[vehicleType] + distanceKm * baseRates[vehicleType], baseFare[vehicleType]);
    }
    haversine(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    async create(passengerId, dto) {
        const distance = this.haversine(dto.pickupLat, dto.pickupLng, dto.dropoffLat, dto.dropoffLng);
        const estimatedPrice = this.calculatePrice(distance, dto.vehicleType);
        const pinCode = Math.floor(1000 + Math.random() * 9000).toString();
        const durationMin = Math.ceil((distance / 30) * 60);
        const ride = await this.prisma.ride.create({
            data: {
                passengerId,
                ...dto,
                distanceKm: Math.round(distance * 10) / 10,
                estimatedPrice: Math.round(estimatedPrice * 100) / 100,
                durationMin,
                pinCode,
                status: 'REQUESTED',
            },
            include: {
                passenger: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
        });
        this.logger.log(`Course créée: ${ride.id}`);
        return ride;
    }
    async findById(id) {
        const ride = await this.prisma.ride.findUnique({
            where: { id },
            include: {
                passenger: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true },
                },
                driver: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
                    },
                },
                payment: true,
                reviews: true,
            },
        });
        if (!ride)
            throw new common_1.NotFoundException('Course introuvable');
        return ride;
    }
    async acceptRide(rideId, driverId) {
        const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
        if (!ride)
            throw new common_1.NotFoundException('Course introuvable');
        if (ride.status !== 'REQUESTED')
            throw new common_1.BadRequestException('Cette course n\'est plus disponible');
        const driver = await this.prisma.driver.findUnique({
            where: { id: driverId },
            select: { status: true, availability: true },
        });
        if (!driver || driver.status !== 'APPROVED')
            throw new common_1.ForbiddenException('Compte chauffeur non approuvé');
        if (driver.availability !== 'ONLINE')
            throw new common_1.BadRequestException('Vous devez être en ligne pour accepter une course');
        const [updatedRide] = await this.prisma.$transaction([
            this.prisma.ride.update({
                where: { id: rideId },
                data: { driverId, status: 'ACCEPTED', acceptedAt: new Date() },
                include: {
                    passenger: { select: { id: true, firstName: true, lastName: true, phone: true } },
                },
            }),
            this.prisma.driver.update({
                where: { id: driverId },
                data: { availability: 'ON_RIDE' },
            }),
        ]);
        return updatedRide;
    }
    async updateStatus(rideId, dto, userId) {
        const ride = await this.prisma.ride.findUnique({
            where: { id: rideId },
            include: { driver: true },
        });
        if (!ride)
            throw new common_1.NotFoundException('Course introuvable');
        const statusTimestamps = {
            DRIVER_EN_ROUTE: 'acceptedAt',
            ARRIVED: 'arrivedAt',
            IN_PROGRESS: 'startedAt',
            COMPLETED: 'completedAt',
            CANCELLED: 'cancelledAt',
        };
        const timestampField = statusTimestamps[dto.status];
        const updateData = { status: dto.status };
        if (timestampField)
            updateData[timestampField] = new Date();
        if (dto.cancelReason)
            updateData.cancelReason = dto.cancelReason;
        if (dto.status === 'COMPLETED') {
            updateData.finalPrice = ride.estimatedPrice;
            if (ride.driverId) {
                await this.prisma.driver.update({
                    where: { id: ride.driverId },
                    data: {
                        availability: 'ONLINE',
                        totalRides: { increment: 1 },
                        totalEarnings: { increment: ride.estimatedPrice },
                    },
                });
            }
        }
        if (dto.status === 'CANCELLED' && ride.driverId) {
            await this.prisma.driver.update({
                where: { id: ride.driverId },
                data: { availability: 'ONLINE' },
            });
        }
        return this.prisma.ride.update({
            where: { id: rideId },
            data: updateData,
        });
    }
    async verifyPin(rideId, pin) {
        const ride = await this.prisma.ride.findUnique({
            where: { id: rideId },
            select: { pinCode: true, status: true },
        });
        if (!ride)
            throw new common_1.NotFoundException('Course introuvable');
        if (ride.status !== 'ARRIVED')
            throw new common_1.BadRequestException('Le chauffeur doit d\'abord signaler son arrivée');
        if (ride.pinCode !== pin)
            throw new common_1.BadRequestException('Code PIN incorrect');
        return this.prisma.ride.update({
            where: { id: rideId },
            data: { status: 'IN_PROGRESS', startedAt: new Date() },
        });
    }
    async getAvailableRides(driverLat, driverLng) {
        const rides = await this.prisma.ride.findMany({
            where: { status: 'REQUESTED', driverId: null },
            include: {
                passenger: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        return rides
            .map((ride) => ({
            ...ride,
            distanceToPickup: Math.round(this.haversine(driverLat, driverLng, ride.pickupLat, ride.pickupLng) * 10) / 10,
        }))
            .sort((a, b) => a.distanceToPickup - b.distanceToPickup)
            .slice(0, 10);
    }
    async submitReview(rideId, authorId, targetId, rating, comment) {
        const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
        if (!ride || ride.status !== 'COMPLETED') {
            throw new common_1.BadRequestException('La course doit être terminée pour noter');
        }
        const review = await this.prisma.review.upsert({
            where: { rideId_authorId: { rideId, authorId } },
            create: { rideId, authorId, targetId, rating, comment },
            update: { rating, comment },
        });
        const driverUser = await this.prisma.driver.findFirst({
            where: { userId: targetId },
        });
        if (driverUser) {
            const avg = await this.prisma.review.aggregate({
                where: { targetId },
                _avg: { rating: true },
                _count: { rating: true },
            });
            await this.prisma.driver.update({
                where: { id: driverUser.id },
                data: {
                    averageRating: Math.round((avg._avg.rating ?? 0) * 10) / 10,
                    ratingCount: avg._count.rating,
                },
            });
        }
        return review;
    }
};
exports.RidesService = RidesService;
exports.RidesService = RidesService = RidesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RidesService);
//# sourceMappingURL=rides.service.js.map