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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriversService = exports.UpdateLocationDto = exports.UpdateDriverAvailabilityDto = exports.CreateDriverProfileDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateDriverProfileDto {
}
exports.CreateDriverProfileDto = CreateDriverProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.VehicleType }),
    (0, class_validator_1.IsEnum)(client_1.VehicleType),
    __metadata("design:type", String)
], CreateDriverProfileDto.prototype, "vehicleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDriverProfileDto.prototype, "vehicleMake", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDriverProfileDto.prototype, "vehicleModel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateDriverProfileDto.prototype, "vehicleYear", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDriverProfileDto.prototype, "vehiclePlate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDriverProfileDto.prototype, "vehicleColor", void 0);
class UpdateDriverAvailabilityDto {
}
exports.UpdateDriverAvailabilityDto = UpdateDriverAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ONLINE', 'OFFLINE'] }),
    (0, class_validator_1.IsEnum)(['ONLINE', 'OFFLINE']),
    __metadata("design:type", String)
], UpdateDriverAvailabilityDto.prototype, "availability", void 0);
class UpdateLocationDto {
}
exports.UpdateLocationDto = UpdateLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "heading", void 0);
let DriversService = class DriversService {
    constructor(prisma, mail) {
        this.prisma = prisma;
        this.mail = mail;
    }
    async createProfile(userId, dto) {
        const existing = await this.prisma.driver.findUnique({ where: { userId } });
        if (existing)
            throw new common_1.BadRequestException('Profil chauffeur déjà existant');
        const plateExists = await this.prisma.driver.findUnique({
            where: { vehiclePlate: dto.vehiclePlate },
        });
        if (plateExists)
            throw new common_1.BadRequestException('Cette plaque d\'immatriculation est déjà utilisée');
        const driver = await this.prisma.driver.create({
            data: { userId, ...dto, status: 'PENDING' },
            include: {
                user: { select: { email: true, firstName: true } },
            },
        });
        return driver;
    }
    async getProfile(userId) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true, email: true, firstName: true, lastName: true,
                        avatarUrl: true, phone: true,
                    },
                },
                documents: true,
            },
        });
        if (!driver)
            throw new common_1.NotFoundException('Profil chauffeur introuvable');
        return driver;
    }
    async uploadDocument(userId, type, fileUrl) {
        const driver = await this.prisma.driver.findUnique({ where: { userId } });
        if (!driver)
            throw new common_1.NotFoundException('Profil chauffeur introuvable');
        return this.prisma.driverDocument.upsert({
            where: {
                id: `${driver.id}-${type}`,
            },
            create: {
                id: `${driver.id}-${type}`,
                driverId: driver.id,
                type,
                fileUrl,
            },
            update: { fileUrl, isVerified: false },
        });
    }
    async updateAvailability(userId, dto) {
        const driver = await this.prisma.driver.findUnique({ where: { userId } });
        if (!driver)
            throw new common_1.NotFoundException('Profil chauffeur introuvable');
        if (driver.status !== 'APPROVED') {
            throw new common_1.ForbiddenException('Votre compte n\'est pas encore validé');
        }
        return this.prisma.driver.update({
            where: { userId },
            data: { availability: dto.availability },
            select: { id: true, availability: true },
        });
    }
    async updateLocation(userId, dto) {
        return this.prisma.driver.update({
            where: { userId },
            data: {
                latitude: dto.latitude,
                longitude: dto.longitude,
                heading: dto.heading,
                lastLocationAt: new Date(),
            },
            select: { id: true, latitude: true, longitude: true },
        });
    }
    async getRideHistory(userId, page = 1, limit = 10) {
        const driver = await this.prisma.driver.findUnique({ where: { userId } });
        if (!driver)
            throw new common_1.NotFoundException('Profil chauffeur introuvable');
        const skip = (page - 1) * limit;
        const [rides, total] = await Promise.all([
            this.prisma.ride.findMany({
                where: { driverId: driver.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true, status: true, pickupAddress: true, dropoffAddress: true,
                    finalPrice: true, estimatedPrice: true, distanceKm: true,
                    durationMin: true, completedAt: true, createdAt: true,
                    passenger: {
                        select: { firstName: true, lastName: true, avatarUrl: true },
                    },
                    reviews: {
                        where: { targetId: userId },
                        select: { rating: true, comment: true },
                    },
                },
            }),
            this.prisma.ride.count({ where: { driverId: driver.id } }),
        ]);
        return {
            data: rides,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getStats(userId) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
            select: { id: true, totalRides: true, totalEarnings: true, averageRating: true, ratingCount: true },
        });
        if (!driver)
            throw new common_1.NotFoundException('Profil chauffeur introuvable');
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [todayStats, weekStats, monthStats] = await Promise.all([
            this.prisma.ride.aggregate({
                where: { driverId: driver.id, status: 'COMPLETED', completedAt: { gte: startOfDay } },
                _sum: { finalPrice: true },
                _count: { id: true },
            }),
            this.prisma.ride.aggregate({
                where: { driverId: driver.id, status: 'COMPLETED', completedAt: { gte: startOfWeek } },
                _sum: { finalPrice: true },
                _count: { id: true },
            }),
            this.prisma.ride.aggregate({
                where: { driverId: driver.id, status: 'COMPLETED', completedAt: { gte: startOfMonth } },
                _sum: { finalPrice: true },
                _count: { id: true },
            }),
        ]);
        return {
            totalRides: driver.totalRides,
            totalEarnings: driver.totalEarnings,
            averageRating: driver.averageRating,
            ratingCount: driver.ratingCount,
            today: {
                earnings: todayStats._sum.finalPrice ?? 0,
                rides: todayStats._count.id,
            },
            week: {
                earnings: weekStats._sum.finalPrice ?? 0,
                rides: weekStats._count.id,
            },
            month: {
                earnings: monthStats._sum.finalPrice ?? 0,
                rides: monthStats._count.id,
            },
        };
    }
    async approveDriver(driverId) {
        const driver = await this.prisma.driver.update({
            where: { id: driverId },
            data: { status: 'APPROVED' },
            include: {
                user: { select: { email: true, firstName: true } },
            },
        });
        await this.mail.sendDriverApproved(driver.user.email, driver.user.firstName ?? 'Chauffeur');
        return driver;
    }
    async rejectDriver(driverId, reason) {
        return this.prisma.driver.update({
            where: { id: driverId },
            data: { status: 'REJECTED' },
        });
    }
    async getPendingDrivers() {
        return this.prisma.driver.findMany({
            where: { status: 'PENDING' },
            include: {
                user: { select: { email: true, firstName: true, lastName: true, createdAt: true } },
                documents: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.DriversService = DriversService;
exports.DriversService = DriversService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], DriversService);
//# sourceMappingURL=drivers.service.js.map