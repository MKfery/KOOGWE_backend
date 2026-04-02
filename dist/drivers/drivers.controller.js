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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriversController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const drivers_service_1 = require("./drivers.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let DriversController = class DriversController {
    constructor(driversService) {
        this.driversService = driversService;
    }
    createProfile(req, dto) {
        return this.driversService.createProfile(req.user.id, dto);
    }
    getProfile(req) {
        return this.driversService.getProfile(req.user.id);
    }
    updateAvailability(req, dto) {
        return this.driversService.updateAvailability(req.user.id, dto);
    }
    updateLocation(req, dto) {
        return this.driversService.updateLocation(req.user.id, dto);
    }
    getStats(req) {
        return this.driversService.getStats(req.user.id);
    }
    getRides(req, page = 1, limit = 10) {
        return this.driversService.getRideHistory(req.user.id, +page, +limit);
    }
    uploadDocument(req, type, fileUrl) {
        return this.driversService.uploadDocument(req.user.id, type, fileUrl);
    }
    getPending() {
        return this.driversService.getPendingDrivers();
    }
    approve(id) {
        return this.driversService.approveDriver(id);
    }
    reject(id, reason) {
        return this.driversService.rejectDriver(id, reason);
    }
};
exports.DriversController = DriversController;
__decorate([
    (0, common_1.Post)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer le profil chauffeur' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, drivers_service_1.CreateDriverProfileDto]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "createProfile", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtenir son profil chauffeur' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Passer en ligne / hors ligne' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, drivers_service_1.UpdateDriverAvailabilityDto]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "updateAvailability", null);
__decorate([
    (0, common_1.Patch)('location'),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour la position GPS' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, drivers_service_1.UpdateLocationDto]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Statistiques de gains' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('rides'),
    (0, swagger_1.ApiOperation)({ summary: 'Historique des courses du chauffeur' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "getRides", null);
__decorate([
    (0, common_1.Post)('documents'),
    (0, swagger_1.ApiOperation)({ summary: 'Enregistrer l\'URL d\'un document uploadé' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('type')),
    __param(2, (0, common_1.Body)('fileUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Get)('admin/pending'),
    (0, jwt_auth_guard_1.Roles)('ADMIN'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: '[ADMIN] Dossiers en attente de validation' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "getPending", null);
__decorate([
    (0, common_1.Patch)('admin/:id/approve'),
    (0, jwt_auth_guard_1.Roles)('ADMIN'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: '[ADMIN] Valider un dossier chauffeur' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)('admin/:id/reject'),
    (0, jwt_auth_guard_1.Roles)('ADMIN'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: '[ADMIN] Rejeter un dossier chauffeur' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "reject", null);
exports.DriversController = DriversController = __decorate([
    (0, swagger_1.ApiTags)('Drivers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('drivers'),
    __metadata("design:paramtypes", [drivers_service_1.DriversService])
], DriversController);
//# sourceMappingURL=drivers.controller.js.map