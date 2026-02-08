import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './auth/auth.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ListingsModule } from './listings/listings.module';
import { RequestsModule } from './requests/requests.module';
import { GeoModule } from './geo/geo.module';
import { MediaModule } from './media/media.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ContractsModule } from './contracts/contracts.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ListingsModule,
    FavoritesModule,
    RequestsModule,
    GeoModule,
    MediaModule,
    ChatModule,
    UsersModule,
    ContractsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
