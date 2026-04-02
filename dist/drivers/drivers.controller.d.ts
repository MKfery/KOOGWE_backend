import { DriversService, CreateDriverProfileDto, UpdateDriverAvailabilityDto, UpdateLocationDto } from './drivers.service';
export declare class DriversController {
    private readonly driversService;
    constructor(driversService: DriversService);
    createProfile(req: any, dto: CreateDriverProfileDto): Promise<{
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
    getProfile(req: any): Promise<{
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
    updateAvailability(req: any, dto: UpdateDriverAvailabilityDto): Promise<{
        id: string;
        availability: import(".prisma/client").$Enums.DriverAvailability;
    }>;
    updateLocation(req: any, dto: UpdateLocationDto): Promise<{
        id: string;
        latitude: number;
        longitude: number;
    }>;
    getStats(req: any): Promise<{
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
    getRides(req: any, page?: number, limit?: number): Promise<{
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
    uploadDocument(req: any, type: string, fileUrl: string): Promise<{
        type: string;
        id: string;
        isVerified: boolean;
        createdAt: Date;
        driverId: string;
        fileUrl: string;
    }>;
    getPending(): Promise<({
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
    approve(id: string): Promise<{
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
    reject(id: string, reason?: string): Promise<{
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
}
