import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { FavoritesService } from './favorites.service';
import { SessionGuard } from '../auth/session.guard';

type RequestWithSession = Request & {
  session: { userId?: string };
};

@Controller('favorites')
@UseGuards(SessionGuard)
export class FavoritesController {
  constructor(private readonly favService: FavoritesService) {}

  private getUserId(req: RequestWithSession): string {
    const userId = req.session?.userId;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return String(userId);
  }

  @Get()
  getMy(@Req() req: RequestWithSession) {
    const userId = this.getUserId(req);
    return this.favService.getUserFavorites(userId);
  }

  @Post(':listingId')
  toggle(
    @Req() req: RequestWithSession,
    @Param('listingId') listingId: string,
  ) {
    const userId = this.getUserId(req);
    const isFavorite = this.favService.toggle(userId, listingId);
    return { isFavorite };
  }
}
