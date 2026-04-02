// src/drivers/drivers.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  IsString, IsOptional, IsEnum, IsInt, IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType, DriverAvailability } from '@prisma/client';

export class CreateDriverProfileDto {
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType: VehicleType;
  @ApiProperty() @IsString() vehicleMake: string;
  @ApiProperty() @IsString() vehicleModel: string;
  @ApiProperty() @IsInt() vehicleYear: number;
  @ApiProperty() @IsString() vehiclePlate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vehicleColor?: string;
}

export class UpdateDriverAvailabilityDto {
  @ApiProperty({ enum: ['ONLINE', 'OFFLINE'] })
  @IsEnum(['ONLINE', 'OFFLINE'])
  availability: 'ONLINE' | 'OFFLINE';
}

export class UpdateLocationDto {
  @ApiProperty() @IsNumber() latitude: number;
  @ApiProperty() @IsNumber() longitude: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() heading?: number;
}

@Injectable()
export class DriversService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  // ─── Créer le profil chauffeur (après inscription) ────────────────────────
  async createProfile(userId: string, dto: CreateDriverProfileDto) {
    // Vérifier si déjà chauffeur
    const existing = await this.prisma.driver.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('Profil chauffeur déjà existant');

    // Vérifier unicité de la plaque
    const plateExists = await this.prisma.driver.findUnique({
      where: { vehiclePlate: dto.vehiclePlate },
    });
    if (plateExists) throw new BadRequestException('Cette plaque d\'immatriculation est déjà utilisée');

    const driver = await this.prisma.driver.create({
      data: { userId, ...dto, status: 'PENDING' },
      include: {
        user: { select: { email: true, firstName: true } },
      },
    });

    return driver;
  }

  // ─── Obtenir le profil chauffeur ──────────────────────────────────────────
  async getProfile(userId: string) {
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
    if (!driver) throw new NotFoundException('Profil chauffeur introuvable');
    return driver;
  }

  // ─── Uploader un document ─────────────────────────────────────────────────
  async uploadDocument(
    userId: string,
    type: string,
    fileUrl: string,
  ) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Profil chauffeur introuvable');

    return this.prisma.driverDocument.upsert({
      where: {
        // Simuler unicité type+driver
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

  // ─── Mettre à jour la disponibilité ──────────────────────────────────────
  async updateAvailability(userId: string, dto: UpdateDriverAvailabilityDto) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Profil chauffeur introuvable');
    if (driver.status !== 'APPROVED') {
      throw new ForbiddenException('Votre compte n\'est pas encore validé');
    }

    return this.prisma.driver.update({
      where: { userId },
      data: { availability: dto.availability },
      select: { id: true, availability: true },
    });
  }

  // ─── Mettre à jour la position GPS ───────────────────────────────────────
  async updateLocation(userId: string, dto: UpdateLocationDto) {
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

  // ─── Historique des courses du chauffeur ──────────────────────────────────
  async getRideHistory(userId: string, page = 1, limit = 10) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Profil chauffeur introuvable');

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

  // ─── Statistiques du chauffeur ────────────────────────────────────────────
  async getStats(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      select: { id: true, totalRides: true, totalEarnings: true, averageRating: true, ratingCount: true },
    });
    if (!driver) throw new NotFoundException('Profil chauffeur introuvable');

    // Gains par période
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

  // ─── ADMIN : Valider un chauffeur ─────────────────────────────────────────
  async approveDriver(driverId: string) {
    const driver = await this.prisma.driver.update({
      where: { id: driverId },
      data: { status: 'APPROVED' },
      include: {
        user: { select: { email: true, firstName: true } },
      },
    });

    // Envoyer email de confirmation
    await this.mail.sendDriverApproved(driver.user.email, driver.user.firstName ?? 'Chauffeur');

    return driver;
  }

  // ─── ADMIN : Rejeter un chauffeur ─────────────────────────────────────────
  async rejectDriver(driverId: string, reason?: string) {
    return this.prisma.driver.update({
      where: { id: driverId },
      data: { status: 'REJECTED' },
    });
  }

  // ─── ADMIN : Liste des chauffeurs en attente ──────────────────────────────
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
}
