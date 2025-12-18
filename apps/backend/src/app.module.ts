import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { RequestsModule } from './requests/requests.module';
import { ContractsModule } from './contracts/contracts.module';

@Module({
  imports: [AuthModule, ListingsModule, RequestsModule, ContractsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
