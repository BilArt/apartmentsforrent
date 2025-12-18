import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  ForbiddenException,
  UseGuards,
  Body,
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
    if (res === 'NOT_APPROVED')
      throw new ForbiddenException('Request must be APPROVED');
    if (res === 'DUPLICATE')
      throw new ForbiddenException('Contract already exists');

    return res;
  }

  @UseGuards(SessionGuard)
  @Get('my')
  my(@Req() req: Request) {
    const userId = req.session.userId!;
    return this.contracts.getMy(userId);
  }

  @UseGuards(SessionGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateContractDto,
  ) {
    const userId = req.session.userId!;
    const res = this.contracts.updateStatus(id, userId, dto.status);

    if (res === null) throw new NotFoundException('Contract not found');
    if (res === 'FORBIDDEN')
      throw new ForbiddenException('You are not a participant');
    if (res === 'FORBIDDEN_SIGN')
      throw new ForbiddenException('Only tenant can sign');

    return res;
  }
}
