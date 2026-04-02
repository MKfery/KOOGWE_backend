// src/rides/rides.service.ts
import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType, PaymentMethod, RideStatus } from '@prisma/client';

export class CreateRideDto {
  @ApiProperty() @IsString() pickupAddress: string;
  @ApiProperty() @IsNumber() pickupLat: number;
  @ApiProperty() @IsNumber() pickupLng: number;
  @ApiProperty() @IsString() dropoffAddress: string;
  @ApiProperty() @IsNumber() dropoffLat: number;
  @ApiProperty() @IsNumber() dropoffLng: number;
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType: VehicleType;
  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
}

export class UpdateRideStatusDto {
  @ApiProperty({ enum: RideStatus }) @IsEnum(RideStatus) status: RideStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() cancelReason?: string;
}

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Calculer le prix estimé ──────────────────────────────────────────────
  private calculatePrice(distanceKm: number, vehicleType: VehicleType): number {
    const baseRates: Record<VehicleType, number> = {
      BERLINE: 1.8,  // €/km
      SUV: 2.2,
      VAN: 2.8,
      MOTO: 1.2,
      LUXE: 3.5,
    };
    const baseFare: Record<VehicleType, number> = {
      BERLINE: 3.0,
      SUV: 4.0,
      VAN: 5.0,
      MOTO: 2.0,
      LUXE: 8.0,
    };
    return Math.max(
      baseFare[vehicleType] + distanceKm * baseRates[vehicleType],
      baseFare[vehicleType],
    );
  }

  // ─── Distance haversine (km) ──────────────────────────────────────────────
  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ─── Créer une course ─────────────────────────────────────────────────────
  async create(passengerId: string, dto: CreateRideDto) {
    const distance = this.haversine(dto.pickupLat, dto.pickupLng, dto.dropoffLat, dto.dropoffLng);
    const estimatedPrice = this.calculatePrice(distance, dto.vehicleType);
    const pinCode = Math.floor(1000 + Math.random() * 9000).toString();
    const durationMin = Math.ceil((distance / 30) * 60); // Vitesse moyenne 30km/h

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

  // ─── Obtenir une course ───────────────────────────────────────────────────
  async findById(id: string) {
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
    if (!ride) throw new NotFoundException('Course introuvable');
    return ride;
  }

  // ─── Chauffeur accepte une course ─────────────────────────────────────────
  async acceptRide(rideId: string, driverId: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Course introuvable');
    if (ride.status !== 'REQUESTED') throw new BadRequestException('Cette course n\'est plus disponible');

    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { status: true, availability: true },
    });
    if (!driver || driver.status !== 'APPROVED') throw new ForbiddenException('Compte chauffeur non approuvé');
    if (driver.availability !== 'ONLINE') throw new BadRequestException('Vous devez être en ligne pour accepter une course');

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

  // ─── Mettre à jour le statut d'une course ─────────────────────────────────
  async updateStatus(rideId: string, dto: UpdateRideStatusDto, userId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });
    if (!ride) throw new NotFoundException('Course introuvable');

    const statusTimestamps: Partial<Record<RideStatus, string>> = {
      DRIVER_EN_ROUTE: 'acceptedAt',
      ARRIVED: 'arrivedAt',
      IN_PROGRESS: 'startedAt',
      COMPLETED: 'completedAt',
      CANCELLED: 'cancelledAt',
    };

    const timestampField = statusTimestamps[dto.status];
    const updateData: any = { status: dto.status };
    if (timestampField) updateData[timestampField] = new Date();
    if (dto.cancelReason) updateData.cancelReason = dto.cancelReason;

    // Si course terminée : calculer prix final, libérer le chauffeur
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

    // Si annulée : libérer le chauffeur
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

  // ─── Vérifier le code PIN ─────────────────────────────────────────────────
  async verifyPin(rideId: string, pin: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      select: { pinCode: true, status: true },
    });
    if (!ride) throw new NotFoundException('Course introuvable');
    if (ride.status !== 'ARRIVED') throw new BadRequestException('Le chauffeur doit d\'abord signaler son arrivée');
    if (ride.pinCode !== pin) throw new BadRequestException('Code PIN incorrect');

    return this.prisma.ride.update({
      where: { id: rideId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
  }

  // ─── Courses disponibles pour les chauffeurs ──────────────────────────────
  async getAvailableRides(driverLat: number, driverLng: number) {
    const rides = await this.prisma.ride.findMany({
      where: { status: 'REQUESTED', driverId: null },
      include: {
        passenger: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Trier par distance du chauffeur
    return rides
      .map((ride) => ({
        ...ride,
        distanceToPickup: Math.round(
          this.haversine(driverLat, driverLng, ride.pickupLat, ride.pickupLng) * 10,
        ) / 10,
      }))
      .sort((a, b) => a.distanceToPickup - b.distanceToPickup)
      .slice(0, 10);
  }

  // ─── Soumettre une note ───────────────────────────────────────────────────
  async submitReview(
    rideId: string,
    authorId: string,
    targetId: string,
    rating: number,
    comment?: string,
  ) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.status !== 'COMPLETED') {
      throw new BadRequestException('La course doit être terminée pour noter');
    }

    const review = await this.prisma.review.upsert({
      where: { rideId_authorId: { rideId, authorId } },
      create: { rideId, authorId, targetId, rating, comment },
      update: { rating, comment },
    });

    // Mettre à jour la note moyenne du chauffeur
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
}
