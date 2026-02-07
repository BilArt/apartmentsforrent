import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, type PublicUser } from './auth.service';
import { SessionGuard } from './session.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Req() req: Request,
  ): Promise<PublicUser> {
    if (String(body.bankId || '').startsWith('manual:') && !body.password) {
      throw new BadRequestException(
        'Password is required for manual registration',
      );
    }

    const user = await this.auth.register(body);
    req.session.userId = user.id;
    return user;
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<PublicUser> {
    if (dto.bankId) {
      const user = await this.auth.loginByBankId(dto.bankId);
      req.session.userId = user.id;
      return user;
    }

    if (dto.phone && dto.password) {
      const user = await this.auth.loginByPhone(dto.phone, dto.password);
      req.session.userId = user.id;
      return user;
    }

    throw new BadRequestException('Provide bankId OR phone+password');
  }

  @Post('logout')
  logout(@Req() req: Request): Promise<{ ok: true }> {
    return new Promise((resolve) => {
      req.session.destroy(() => resolve({ ok: true }));
    });
  }

  @UseGuards(SessionGuard)
  @Get('me')
  async me(@Req() req: Request): Promise<PublicUser> {
    const userId = req.session.userId;
    if (!userId) throw new UnauthorizedException('Not authenticated');

    const user = await this.auth.getById(String(userId));
    if (!user) throw new UnauthorizedException('Not authenticated');

    return user;
  }
}
