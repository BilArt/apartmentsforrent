import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { SessionGuard } from '../auth/session.guard';

@Module({
  providers: [FavoritesService, SessionGuard],
  controllers: [FavoritesController],
})
export class FavoritesModule {}
