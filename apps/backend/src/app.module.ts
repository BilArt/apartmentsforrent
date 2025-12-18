import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [AuthModule, ListingsModule, RequestsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
