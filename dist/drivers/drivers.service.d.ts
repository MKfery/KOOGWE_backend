import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { VehicleType } from '@prisma/client';
export declare class CreateDriverProfileDto {
    vehicleType: VehicleType;
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
    vehiclePlate: string;
    vehicleColor?: string;
}
export declare class UpdateDriverAvailabilityDto {
    availability: 'ONLINE' | 'OFFLINE';
}
export declare class UpdateLocationDto {
    latitude: number;
    longitude: number;
    heading?: number;
}
export declare class DriversService {
    private prisma;
    private mail;
    constructor(prisma: PrismaService, mail: MailService);
    createProfile(userId: string, dto: CreateDriverProfileDto): Promise<{
        user: {
            email: string;
            firstName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        vehicleMake: string | null;
        vehicleModel: string | null;
        vehicleYear: number | null;
        vehiclePlate: string | null;
        vehicleColor: string | null;
        status: import(".prisma/client").$Enums.DriverStatus;
        availability: import(".prisma/client").$Enums.DriverAvailability;
        latitude: number | null;
        longitude: number | null;
        heading: number | null;
        lastLocationAt: Date | null;
        totalRides: number;
        totalEarnings: number;
        averageRating: number;
        ratingCount: number;
    }>;
    getProfile(userId: string): Promise<{
        user: {
            email: string;
            id: string;
            phone: string;
            firstName: string;
            lastName: string;
            avatarUrl: string;
        };
        documents: {
            type: string;
            id: string;
            isVerified: boolean;
            createdAt: Date;
            driverId: string;
            fileUrl: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        vehicleMake: string | null;
        vehicleModel: string | null;
        vehicleYear: number | null;
        vehiclePlate: string | null;
        vehicleColor: string | null;
        status: import(".prisma/client").$Enums.DriverStatus;
        availability: import(".prisma/client").$Enums.DriverAvailability;
        latitude: number | null;
        longitude: number | null;
        heading: number | null;
        lastLocationAt: Date | null;
        totalRides: number;
        totalEarnings: number;
        averageRating: number;
        ratingCount: number;
    }>;
    uploadDocument(userId: string, type: string, fileUrl: string): Promise<{
        type: string;
        id: string;
        isVerified: boolean;
        createdAt: Date;
        driverId: string;
        fileUrl: string;
    }>;
    updateAvailability(userId: string, dto: UpdateDriverAvailabilityDto): Promise<{
        id: string;
        availability: import(".prisma/client").$Enums.DriverAvailability;
    }>;
    updateLocation(userId: string, dto: UpdateLocationDto): Promise<{
        id: string;
        latitude: number;
        longitude: number;
    }>;
    getRideHistory(userId: string, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.RideStatus;
            pickupAddress: string;
            dropoffAddress: string;
            estimatedPrice: number;
            finalPrice: number;
            distanceKm: number;
            durationMin: number;
            completedAt: Date;
            passenger: {
                firstName: string;
                lastName: string;
                avatarUrl: string;
            };
            reviews: {
                rating: number;
                comment: string;
            }[];
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(userId: string): Promise<{
        totalRides: number;
        totalEarnings: number;
        averageRating: number;
        ratingCount: number;
        today: {
            earnings: number;
            rides: number;
        };
        week: {
            earnings: number;
            rides: number;
        };
        month: {
            earnings: number;
            rides: number;
        };
    }>;
    approveDriver(driverId: string): Promise<{
        user: {
            email: string;
            firstName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        vehicleMake: string | null;
        vehicleModel: string | null;
        vehicleYear: number | null;
        vehiclePlate: string | null;
        vehicleColor: string | null;
        status: import(".prisma/client").$Enums.DriverStatus;
        availability: import(".prisma/client").$Enums.DriverAvailability;
        latitude: number | null;
        longitude: number | null;
        heading: number | null;
        lastLocationAt: Date | null;
        totalRides: number;
        totalEarnings: number;
        averageRating: number;
        ratingCount: number;
    }>;
    rejectDriver(driverId: string, reason?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        vehicleMake: string | null;
        vehicleModel: string | null;
        vehicleYear: number | null;
        vehiclePlate: string | null;
        vehicleColor: string | null;
        status: import(".prisma/client").$Enums.DriverStatus;
        availability: import(".prisma/client").$Enums.DriverAvailability;
        latitude: number | null;
        longitude: number | null;
        heading: number | null;
        lastLocationAt: Date | null;
        totalRides: number;
        totalEarnings: number;
        averageRating: number;
        ratingCount: number;
    }>;
    getPendingDrivers(): Promise<({
        user: {
            email: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
        };
        documents: {
            type: string;
            id: string;
            isVerified: boolean;
            createdAt: Date;
            driverId: string;
            fileUrl: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        vehicleMake: string | null;
        vehicleModel: string | null;
        vehicleYear: number | null;
        vehiclePlate: string | null;
        vehicleColor: string | null;
        status: import(".prisma/client").$Enums.DriverStatus;
        availability: import(".prisma/client").$Enums.DriverAvailability;
        latitude: number | null;
        longitude: number | null;
        heading: number | null;
        lastLocationAt: Date | null;
        totalRides: number;
        totalEarnings: number;
        averageRating: number;
        ratingCount: number;
    })[]>;
}
