// src/drivers/drivers.controller.ts
import {
  Controller, Get, Post, Patch, Body, Req,
  Query, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  DriversService,
  CreateDriverProfileDto,
  UpdateDriverAvailabilityDto,
  UpdateLocationDto,
} from './drivers.service';
import { Roles, RolesGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Drivers')
@ApiBearerAuth()
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Créer le profil chauffeur' })
  createProfile(@Req() req: any, @Body() dto: CreateDriverProfileDto) {
    return this.driversService.createProfile(req.user.id, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Obtenir son profil chauffeur' })
  getProfile(@Req() req: any) {
    return this.driversService.getProfile(req.user.id);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Passer en ligne / hors ligne' })
  updateAvailability(@Req() req: any, @Body() dto: UpdateDriverAvailabilityDto) {
    return this.driversService.updateAvailability(req.user.id, dto);
  }

  @Patch('location')
  @ApiOperation({ summary: 'Mettre à jour la position GPS' })
  updateLocation(@Req() req: any, @Body() dto: UpdateLocationDto) {
    return this.driversService.updateLocation(req.user.id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques de gains' })
  getStats(@Req() req: any) {
    return this.driversService.getStats(req.user.id);
  }

  @Get('rides')
  @ApiOperation({ summary: 'Historique des courses du chauffeur' })
  getRides(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.driversService.getRideHistory(req.user.id, +page, +limit);
  }

  @Post('documents')
  @ApiOperation({ summary: 'Enregistrer l\'URL d\'un document uploadé' })
  uploadDocument(
    @Req() req: any,
    @Body('type') type: string,
    @Body('fileUrl') fileUrl: string,
  ) {
    return this.driversService.uploadDocument(req.user.id, type, fileUrl);
  }

  @Get('admin/pending')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '[ADMIN] Dossiers en attente de validation' })
  getPending() {
    return this.driversService.getPendingDrivers();
  }

  @Patch('admin/:id/approve')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '[ADMIN] Valider un dossier chauffeur' })
  approve(@Param('id') id: string) {
    return this.driversService.approveDriver(id);
  }

  @Patch('admin/:id/reject')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '[ADMIN] Rejeter un dossier chauffeur' })
  reject(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.driversService.rejectDriver(id, reason);
  }
}
