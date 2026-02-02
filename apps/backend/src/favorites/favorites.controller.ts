import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { FavoritesService } from './favorites.service';

type RequestWithUser = Request & { user: { id: string } };

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favService: FavoritesService) {}

  @Get()
  getMy(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.favService.getUserFavorites(userId);
  }

  @Post(':listingId')
  toggle(@Req() req: RequestWithUser, @Param('listingId') listingId: string) {
    const userId = req.user.id;
    const isFavorite = this.favService.toggle(userId, listingId);
    return { isFavorite };
  }
}
