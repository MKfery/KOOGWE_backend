// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() avatarUrl?: string;
  @ApiPropertyOptional({ enum: ['fr', 'en', 'es', 'pt', 'ht'] })
  @IsOptional() @IsIn(['fr', 'en', 'es', 'pt', 'ht']) language?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
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
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        avatarUrl: true, phone: true, language: true,
      },
    });
  }

  async getRideHistory(userId: string, page = 1, limit = 10) {
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

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(notifId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notifId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllNotificationsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
