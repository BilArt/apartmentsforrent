import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':id')
  async getPublic(@Param('id') id: string) {
    const user = await this.users.getPublicById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
