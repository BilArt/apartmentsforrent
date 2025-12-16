import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';

@Module({
  imports: [AuthModule, ListingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
