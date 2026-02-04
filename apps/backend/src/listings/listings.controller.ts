import {
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
  Query,
  Delete,
} from '@nestjs/common';
import type { Request } from 'express';

import { SessionGuard } from '../auth/session.guard';
import {
  ListingsService,
  type OwnerPublic,
  type ListingDb,
} from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

type ListingWithOwner = ListingDb & {
  owner: OwnerPublic | null;
  landlordName: string;
  landlordRating: number;
};

function enrichListing(
  listing: ListingDb,
  owner: OwnerPublic | null,
): ListingWithOwner {
  const landlordName = owner
    ? `${owner.firstName} ${owner.lastName}`
    : 'Орендодавець';
  const landlordRating = owner?.rating ?? 0;

  return {
    ...listing,
    owner,
    landlordName,
    landlordRating,
  };
}

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  async getAll(@Query('cityId') cityId?: string): Promise<ListingWithOwner[]> {
    const items = await this.listings.getAll({ cityId });
    const ownersMap = await this.listings.getOwnersMap(
      items.map((l) => l.ownerId),
    );
    return items.map((l) => enrichListing(l, ownersMap.get(l.ownerId) ?? null));
  }

  @UseGuards(SessionGuard)
  @Get('my')
  async my(@Req() req: Request): Promise<ListingWithOwner[]> {
    const userId = String(req.session.userId);
    const items = await this.listings.getByOwner(userId);
    const ownersMap = await this.listings.getOwnersMap(
      items.map((l) => l.ownerId),
    );
    return items.map((l) => enrichListing(l, ownersMap.get(l.ownerId) ?? null));
  }

  @UseGuards(SessionGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateListingDto,
  ): Promise<ListingWithOwner> {
    const ownerId = String(req.session.userId);
    const res = await this.listings.update(id, ownerId, dto);

    if (res === null) throw new NotFoundException('Listing not found');
    if (res === 'FORBIDDEN')
      throw new ForbiddenException('You can edit only your listings');

    const ownersMap = await this.listings.getOwnersMap([res.ownerId]);
    return enrichListing(res, ownersMap.get(res.ownerId) ?? null);
  }

  @UseGuards(SessionGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ ok: true }> {
    const ownerId = String(req.session.userId);
    const res = await this.listings.delete(id, ownerId);

    if (res === null) throw new NotFoundException('Listing not found');
    if (res === 'FORBIDDEN')
      throw new ForbiddenException('You can delete only your listings');

    return { ok: true };
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ListingWithOwner> {
    const listing = await this.listings.getById(id);
    if (!listing) throw new NotFoundException('Listing not found');

    const viewerId = req.session?.userId ? String(req.session.userId) : null;

    if (
      listing.status === 'HIDDEN' &&
      String(listing.ownerId) !== String(viewerId)
    ) {
      throw new NotFoundException('Listing not found');
    }

    const ownersMap = await this.listings.getOwnersMap([listing.ownerId]);
    return enrichListing(listing, ownersMap.get(listing.ownerId) ?? null);
  }

  @UseGuards(SessionGuard)
  @Post()
  async create(
    @Req() req: Request,
    @Body() body: CreateListingDto,
  ): Promise<ListingWithOwner> {
    const created = await this.listings.create(
      String(req.session.userId),
      body,
    );
    const ownersMap = await this.listings.getOwnersMap([created.ownerId]);
    return enrichListing(created, ownersMap.get(created.ownerId) ?? null);
  }
}
