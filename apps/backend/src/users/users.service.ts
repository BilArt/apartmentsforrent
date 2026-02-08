import { Injectable } from '@nestjs/common';
import { prisma } from '../db/prisma';

export type UserPublicDto = {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
};

@Injectable()
export class UsersService {
  async getPublicById(id: string): Promise<UserPublicDto | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, rating: true },
    });

    return user ?? null;
  }
}
