import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { SessionGuard } from '../auth/session.guard';
import { RequestsService, type RequestWithDetails } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

@Controller()
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @UseGuards(SessionGuard)
  @Post('listings/:id/requests')
  async create(
    @Param('id') listingId: string,
    @Req() req: Request,
    @Body() dto: CreateRequestDto,
  ): Promise<RequestWithDetails> {
    const tenantId = String(req.session.userId);

    const res = await this.requests.create(listingId, tenantId, dto);

    if (res === 'NOT_FOUND') throw new NotFoundException('Listing not found');
    if (res === 'FORBIDDEN_SELF') {
      throw new ForbiddenException('You cannot request your own listing');
    }
    if (res === 'DUPLICATE') {
      throw new ForbiddenException('You already have a pending request');
    }
    if (res === 'ALREADY_RENTED') {
      throw new ForbiddenException('Listing already has a signed contract');
    }
    if (res === 'INVALID_DATES') {
      throw new BadRequestException(
        'Invalid dates. Use YYYY-MM-DD or ISO DateTime, and ensure from <= to.',
      );
    }

    const full = await this.requests.getById(res.requestId);
    if (!full) throw new NotFoundException('Request not found');

    return full;
  }

  @UseGuards(SessionGuard)
  @Get('requests/my')
  my(@Req() req: Request): Promise<RequestWithDetails[]> {
    const tenantId = String(req.session.userId);
    return this.requests.getMy(tenantId);
  }

  @UseGuards(SessionGuard)
  @Get('requests/incoming')
  incoming(@Req() req: Request): Promise<RequestWithDetails[]> {
    const ownerId = String(req.session.userId);
    return this.requests.getIncoming(ownerId);
  }

  @UseGuards(SessionGuard)
  @Patch('requests/:id')
  async updateStatus(
    @Param('id') requestId: string,
    @Req() req: Request,
    @Body() dto: UpdateRequestDto,
  ): Promise<RequestWithDetails> {
    const ownerId = String(req.session.userId);

    const res = await this.requests.updateStatus(requestId, ownerId, dto);

    if (res === 'NOT_FOUND') throw new NotFoundException('Request not found');
    if (res === 'FORBIDDEN') {
      throw new ForbiddenException('You can update only incoming requests');
    }

    const full = await this.requests.getById(res.requestId);
    if (!full) throw new NotFoundException('Request not found');

    return full;
  }
}
