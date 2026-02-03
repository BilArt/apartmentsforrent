import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { prisma } from '../db/prisma';

export type PublicUser = {
  id: string;
  bankId: string;
  rating: number;
  firstName: string;
  lastName: string;
  phone: string;
};

@Injectable()
export class AuthService {
  async register(data: {
    bankId: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<PublicUser> {
    const exists = await prisma.user.findUnique({
      where: { bankId: data.bankId },
      select: { id: true },
    });

    if (exists) {
      throw new BadRequestException('User with this bankId already exists');
    }

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        bankId: data.bankId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        rating: 0,
      },
      select: {
        id: true,
        bankId: true,
        rating: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    return user;
  }

  async login(bankId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { bankId },
      select: {
        id: true,
        bankId: true,
        rating: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async getById(id: string): Promise<PublicUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        bankId: true,
        rating: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });
  }
}
