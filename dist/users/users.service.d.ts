import { PrismaService } from '../prisma/prisma.service';
export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    language?: string;
}
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        driver: {
            id: string;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
            vehicleMake: string;
            vehicleModel: string;
            vehiclePlate: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            availability: import(".prisma/client").$Enums.DriverAvailability;
            totalRides: number;
            totalEarnings: number;
            averageRating: number;
        };
        email: string;
        language: string;
        id: string;
        phone: string;
        firstName: string;
        lastName: string;
        avatarUrl: string;
        role: import(".prisma/client").$Enums.UserRole;
        isVerified: boolean;
        createdAt: Date;
        _count: {
            passengerRides: number;
        };
    }>;
    updateProfile(id: string, dto: UpdateProfileDto): Promise<{
        email: string;
        language: string;
        id: string;
        phone: string;
        firstName: string;
        lastName: string;
        avatarUrl: string;
    }>;
    getRideHistory(userId: string, page?: number, limit?: number): Promise<{
        data: {
            driver: {
                user: {
                    firstName: string;
                    lastName: string;
                    avatarUrl: string;
                };
                vehicleType: import(".prisma/client").$Enums.VehicleType;
                vehicleMake: string;
                vehicleModel: string;
            };
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
    getNotifications(userId: string): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    markNotificationRead(notifId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllNotificationsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
