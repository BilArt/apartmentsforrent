import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BankIdController } from './bankid.controller';
import { MockBankIdController } from './mock-bankid.controller';

@Module({
  controllers: [AuthController, BankIdController, MockBankIdController],
  providers: [AuthService],
})
export class AuthModule {}
