import { UsersService, UpdateProfileDto } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<{
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
    updateProfile(req: any, dto: UpdateProfileDto): Promise<{
        email: string;
        language: string;
        id: string;
        phone: string;
        firstName: string;
        lastName: string;
        avatarUrl: string;
    }>;
    getRides(req: any, page?: number, limit?: number): Promise<{
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
    getNotifications(req: any): Promise<{
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
    markAllRead(req: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markRead(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
