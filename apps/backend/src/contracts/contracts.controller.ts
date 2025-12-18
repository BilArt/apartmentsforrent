import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  ForbiddenException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { ContractsService } from './contracts.service';
import { UpdateContractDto } from './dto/update-contract.dto';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  @UseGuards(SessionGuard)
  @Post('from-request/:requestId')
  createFromRequest(
    @Param('requestId') requestId: string,
    @Req() req: Request,
  ) {
    const ownerId = req.session.userId!;
    const res = this.contracts.createFromRequest(requestId, ownerId);

    if (res === null) throw new NotFoundException('Request not found');
    if (res === 'FORBIDDEN')
      throw new ForbiddenException('Only owner can create contract');
    if (res === 'REQUEST_NOT_APPROVED')
      throw new BadRequestException(
        'Request must be APPROVED to create contract',
      );
    if (res === 'ALREADY_EXISTS')
      throw new BadRequestException('Contract for this request already exists');

    return res;
  }

  @UseGuards(SessionGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateContractDto,
  ) {
    const userId = req.session.userId!;
    const res = this.contracts.updateStatus(id, userId, dto);

    if (res === null) throw new NotFoundException('Contract not found');
    if (res === 'FORBIDDEN') throw new ForbiddenException('Not your contract');
    if (res === 'INVALID_TRANSITION')
      throw new BadRequestException('Invalid status transition');

    return res;
  }

  @UseGuards(SessionGuard)
  @Get('my')
  my(@Req() req: Request) {
    const userId = req.session.userId!;
    return this.contracts.getMy(userId);
  }
}
