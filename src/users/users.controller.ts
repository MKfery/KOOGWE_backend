// src/users/users.controller.ts
import { Controller, Get, Patch, Body, Req, Query, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService, UpdateProfileDto } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Profil complet de l\'utilisateur connecté' })
  getMe(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Mise à jour du profil' })
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get('me/rides')
  @ApiOperation({ summary: 'Historique des courses du passager' })
  getRides(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.usersService.getRideHistory(req.user.id, +page, +limit);
  }

  @Get('me/notifications')
  @ApiOperation({ summary: 'Notifications de l\'utilisateur' })
  getNotifications(@Req() req: any) {
    return this.usersService.getNotifications(req.user.id);
  }

  @Patch('me/notifications/read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  markAllRead(@Req() req: any) {
    return this.usersService.markAllNotificationsRead(req.user.id);
  }

  @Patch('me/notifications/:id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.usersService.markNotificationRead(id, req.user.id);
  }
}
