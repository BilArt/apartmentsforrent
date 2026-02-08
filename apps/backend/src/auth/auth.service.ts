import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';

export type PublicUser = {
  id: string;
  bankId: string;
  rating: number;
  firstName: string;
  lastName: string;
  phone: string;
  bankIdVerified: boolean;
  bankIdVerifiedAt: Date | null;
};

type DbUserWithHash = PublicUser & { passwordHash: string | null };

function toPublicUser(u: DbUserWithHash): PublicUser {
  return {
    id: u.id,
    bankId: u.bankId,
    rating: u.rating,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    bankIdVerified: u.bankIdVerified,
    bankIdVerifiedAt: u.bankIdVerifiedAt,
  };
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(data: RegisterDto): Promise<PublicUser> {
    const existsByBankId = await this.prisma.user.findUnique({
      where: { bankId: data.bankId },
      select: { id: true },
    });

    if (existsByBankId) {
      throw new BadRequestException('User with this bankId already exists');
    }

    const existsByPhone = await this.prisma.user.findFirst({
      where: { phone: data.phone },
      select: { id: true },
    });

    if (existsByPhone) {
      throw new BadRequestException('User with this phone already exists');
    }

    const passwordHash =
      data.password && data.password.length
        ? await bcrypt.hash(data.password, 10)
        : null;

    if (String(data.bankId).startsWith('manual:') && !passwordHash) {
      throw new BadRequestException(
        'Password is required for manual registration',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        bankId: data.bankId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        rating: 0,
        passwordHash,
        bankIdVerified: false,
        bankIdVerifiedAt: null,
      },
      select: {
        id: true,
        bankId: true,
        rating: true,
        firstName: true,
        lastName: true,
        phone: true,
        bankIdVerified: true,
        bankIdVerifiedAt: true,
        passwordHash: true,
      },
    });

    return toPublicUser(user);
  }

  async loginByBankId(bankId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { bankId },
      select: {
        id: true,
        bankId: true,
        rating: true,
        firstName: true,
        lastName: true,
        phone: true,
        bankIdVerified: true,
        bankIdVerifiedAt: true,
        passwordHash: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    return toPublicUser(user);
  }

  async loginByPhone(phone: string, password: string): Promise<PublicUser> {
    const user = await this.prisma.user.findFirst({
      where: { phone },
      select: {
        id: true,
        bankId: true,
        rating: true,
        firstName: true,
        lastName: true,
        phone: true,
        bankIdVerified: true,
        bankIdVerifiedAt: true,
        passwordHash: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    if (!user.passwordHash) {
      throw new UnauthorizedException('Use BankID to sign in for this account');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return toPublicUser(user);
  }

  async getById(id: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        bankId: true,
        rating: true,
        firstName: true,
        lastName: true,
        phone: true,
        bankIdVerified: true,
        bankIdVerifiedAt: true,
        passwordHash: true,
      },
    });

    return user ? toPublicUser(user) : null;
  }
}
