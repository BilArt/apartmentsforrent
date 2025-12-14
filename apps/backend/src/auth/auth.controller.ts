import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      phone: string;
      bankId: string;
    },
    @Req() req: Request,
  ) {
    const user = this.auth.register(body);
    req.session.userId = user.id;
    return user;
  }

  @Post('login')
  login(@Body() body: { bankId: string }, @Req() req: Request) {
    const user = this.auth.login(body.bankId);
    req.session.userId = user.id;
    return user;
  }

  @Post('logout')
  logout(@Req() req: Request) {
    req.session.destroy(() => {});
    return { ok: true };
  }

  @Get('me')
  me(@Req() req: Request) {
    const userId = req.session.userId;
    if (!userId) return null;
    return this.auth.getById(userId) ?? null;
  }
}
