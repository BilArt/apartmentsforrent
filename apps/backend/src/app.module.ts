import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ListingsModule } from './listings/listings.module';
import { RequestsModule } from './requests/requests.module';
import { GeoModule } from './geo/geo.module';

import { MediaModule } from './media/media.module';

@Module({
  imports: [
    AuthModule,
    ListingsModule,
    FavoritesModule,
    RequestsModule,
    GeoModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
