// src/rides/rides.controller.ts
import {
  Controller, Post, Get, Patch, Body, Param, Req, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RidesService, CreateRideDto, UpdateRideStatusDto } from './rides.service';
import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

class ReviewDto {
  @ApiProperty() @IsString() targetId: string;
  @ApiProperty() @IsNumber() @Min(1) @Max(5) rating: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}

class PinDto {
  @ApiProperty() @IsString() pin: string;
}

@ApiTags('Rides')
@ApiBearerAuth()
@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle course (passager)' })
  create(@Req() req: any, @Body() dto: CreateRideDto) {
    return this.ridesService.create(req.user.id, dto);
  }

  @Get('available')
  @ApiOperation({ summary: 'Courses disponibles à proximité (chauffeur)' })
  getAvailable(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.ridesService.getAvailableRides(+lat, +lng);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une course' })
  findOne(@Param('id') id: string) {
    return this.ridesService.findById(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Chauffeur accepte une course' })
  accept(@Param('id') id: string, @Req() req: any) {
    return this.ridesService.acceptRide(id, req.user.driver.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut de la course' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRideStatusDto, @Req() req: any) {
    return this.ridesService.updateStatus(id, dto, req.user.id);
  }

  @Post(':id/verify-pin')
  @ApiOperation({ summary: 'Vérifier le code PIN pour démarrer la course' })
  verifyPin(@Param('id') id: string, @Body() dto: PinDto) {
    return this.ridesService.verifyPin(id, dto.pin);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Soumettre une note après la course' })
  review(@Param('id') id: string, @Req() req: any, @Body() dto: ReviewDto) {
    return this.ridesService.submitReview(id, req.user.id, dto.targetId, dto.rating, dto.comment);
  }
}
