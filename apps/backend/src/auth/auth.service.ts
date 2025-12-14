import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { users, User } from './users.store';

function makeId() {
  return crypto.randomUUID();
}

@Injectable()
export class AuthService {
  register(data: Omit<User, 'id' | 'rating'>) {
    const exists = users.find((u) => u.bankId === data.bankId);
    if (exists)
      throw new BadRequestException('User with this bankId already exists');

    const user: User = {
      id: makeId(),
      rating: 0,
      ...data,
    };

    users.push(user);
    return user;
  }

  login(bankId: string) {
    const user = users.find((u) => u.bankId === bankId);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  getById(id: string) {
    return users.find((u) => u.id === id);
  }

  getAll() {
    return users;
  }
}
