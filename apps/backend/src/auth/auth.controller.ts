import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from '../listings/dto/login.dto';
import { RegisterDto } from '../listings/dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto, @Req() req: Request) {
    const user = this.auth.register(body);
    req.session['userId'] = user.id;
    return user;
  }

  @Post('login')
  login(@Body() body: LoginDto, @Req() req: Request) {
    const user = this.auth.login(body.bankId);
    req.session['userId'] = user.id;
    return user;
  }

  @Post('logout')
  logout(@Req() req: Request) {
    return new Promise((resolve) => {
      req.session.destroy(() => resolve({ ok: true }));
    });
  }

  @Get('me')
  me(@Req() req: Request) {
    const userId = req.session['userId'];
    if (!userId) return null;
    return this.auth.getById(userId) ?? null;
  }
}
