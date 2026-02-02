import { Module } from '@nestjs/common';
import { FavoritesModule } from './favorites/favorites.module';
import { ListingsModule } from './listings/listings.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, ListingsModule, FavoritesModule],
})
export class AppModule {}
