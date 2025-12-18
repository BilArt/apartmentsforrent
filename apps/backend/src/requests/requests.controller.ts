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
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { users, type User } from '../auth/users.store';
import { listings, type Listing } from '../listings/listings.store';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import type { BookingRequest } from './requests.store';

type UserPublic = Pick<User, 'id' | 'firstName' | 'lastName' | 'rating'>;

type RequestWithDetails = BookingRequest & {
  tenant: UserPublic | null;
  listing: Listing | null;
};

function enrich(r: BookingRequest): RequestWithDetails {
  const tenant = users.find((u) => u.id === r.tenantId) ?? null;
  const listing = listings.find((l) => l.id === r.listingId) ?? null;

  return {
    ...r,
    tenant: tenant
      ? {
          id: tenant.id,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          rating: tenant.rating,
        }
      : null,
    listing,
  };
}

@Controller()
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @UseGuards(SessionGuard)
  @Post('listings/:id/requests')
  create(
    @Param('id') listingId: string,
    @Req() req: Request,
    @Body() dto: CreateRequestDto,
  ) {
    const tenantId = req.session.userId!;
    const res = this.requests.create(listingId, tenantId, dto);

    if (res === null) throw new NotFoundException('Listing not found');
    if (res === 'FORBIDDEN_SELF')
      throw new ForbiddenException('You cannot request your own listing');
    if (res === 'DUPLICATE')
      throw new ForbiddenException('You already have a pending request');

    return enrich(res);
  }

  @UseGuards(SessionGuard)
  @Get('requests/my')
  my(@Req() req: Request): RequestWithDetails[] {
    const tenantId = req.session.userId!;
    return this.requests.getMy(tenantId).map(enrich);
  }

  @UseGuards(SessionGuard)
  @Get('requests/incoming')
  incoming(@Req() req: Request): RequestWithDetails[] {
    const ownerId = req.session.userId!;
    return this.requests.getIncoming(ownerId).map(enrich);
  }

  @UseGuards(SessionGuard)
  @Patch('requests/:id')
  updateStatus(
    @Param('id') requestId: string,
    @Req() req: Request,
    @Body() dto: UpdateRequestDto,
  ) {
    const ownerId = req.session.userId!;
    const res = this.requests.updateStatus(requestId, ownerId, dto);

    if (res === null) throw new NotFoundException('Request not found');
    if (res === 'FORBIDDEN')
      throw new ForbiddenException('You can update only incoming requests');

    return enrich(res);
  }
}
