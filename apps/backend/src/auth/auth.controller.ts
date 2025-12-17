import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from '../listings/dto/login.dto';
import { RegisterDto } from '../listings/dto/register.dto';
import { SessionGuard } from './session.guard';
import type { User } from './users.store';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto, @Req() req: Request): User {
    const user = this.auth.register(body);
    req.session.userId = user.id;
    return user;
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request): User {
    const user = this.auth.login(dto.bankId);
    req.session.userId = user.id;
    return user;
  }

  @Post('logout')
  logout(@Req() req: Request): Promise<{ ok: true }> {
    return new Promise((resolve) => {
      req.session.destroy(() => resolve({ ok: true }));
    });
  }

  @UseGuards(SessionGuard)
  @Get('me')
  me(@Req() req: Request): User {
    const userId = req.session.userId;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return this.auth.getById(userId)!;
  }
}
