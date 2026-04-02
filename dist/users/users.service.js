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
exports.UsersService = exports.UpdateProfileDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateProfileDto {
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['fr', 'en', 'es', 'pt', 'ht'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['fr', 'en', 'es', 'pt', 'ht']),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "language", void 0);
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true, email: true, firstName: true, lastName: true,
                avatarUrl: true, phone: true, role: true, isVerified: true,
                language: true, createdAt: true,
                driver: {
                    select: {
                        id: true, status: true, availability: true,
                        vehicleType: true, vehicleMake: true, vehicleModel: true,
                        vehiclePlate: true, averageRating: true, totalRides: true,
                        totalEarnings: true,
                    },
                },
                _count: {
                    select: { passengerRides: { where: { status: 'COMPLETED' } } },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        return user;
    }
    async updateProfile(id, dto) {
        return this.prisma.user.update({
            where: { id },
            data: dto,
            select: {
                id: true, email: true, firstName: true, lastName: true,
                avatarUrl: true, phone: true, language: true,
            },
        });
    }
    async getRideHistory(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [rides, total] = await Promise.all([
            this.prisma.ride.findMany({
                where: { passengerId: userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true, status: true, pickupAddress: true, dropoffAddress: true,
                    finalPrice: true, estimatedPrice: true, distanceKm: true,
                    durationMin: true, completedAt: true, createdAt: true,
                    driver: {
                        select: {
                            vehicleType: true, vehicleMake: true, vehicleModel: true,
                            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
                        },
                    },
                    reviews: {
                        where: { authorId: userId },
                        select: { rating: true, comment: true },
                    },
                },
            }),
            this.prisma.ride.count({ where: { passengerId: userId } }),
        ]);
        return {
            data: rides,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getNotifications(userId) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async markNotificationRead(notifId, userId) {
        return this.prisma.notification.updateMany({
            where: { id: notifId, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllNotificationsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map