import { Injectable } from '@nestjs/common';
import { listings, type Listing } from './listings.store';
import type { CreateListingDto } from './dto/create-listing.dto';

type GetAllFilter = {
  cityId?: string;
};

@Injectable()
export class ListingsService {
  getAll(filter: GetAllFilter = {}) {
    const cityId = filter.cityId ? Number(filter.cityId) : null;
    if (!cityId) return listings;

    return listings.filter((l) => l.city.geonameId === cityId);
  }

  getById(id: string) {
    return listings.find((l) => l.id === id);
  }

  getByOwner(ownerId: string) {
    return listings.filter((l) => l.ownerId === ownerId);
  }

  create(ownerId: string, dto: CreateListingDto) {
    const listing: Listing = {
      id: crypto.randomUUID(),
      ownerId,
      title: dto.title,
      city: dto.city,
      address: dto.address,
      description: dto.description,
      price: dto.price,
      images: dto.images ?? [],
    };

    listings.unshift(listing);
    return listing;
  }

  update(id: string, ownerId: string, dto: Partial<CreateListingDto>) {
    const idx = listings.findIndex((l) => l.id === id);
    if (idx === -1) return null;

    const current = listings[idx];
    if (current.ownerId !== ownerId) return 'FORBIDDEN' as const;

    const updated: Listing = {
      ...current,
      title: dto.title ?? current.title,
      city: dto.city ?? current.city,
      address: dto.address ?? current.address,
      description: dto.description ?? current.description,
      price: dto.price ?? current.price,
      images: dto.images ?? current.images,
    };

    listings[idx] = updated;
    return updated;
  }

  delete(id: string, ownerId: string) {
    const idx = listings.findIndex((l) => l.id === id);
    if (idx === -1) return null;

    const current = listings[idx];
    if (current.ownerId !== ownerId) return 'FORBIDDEN' as const;

    const [removed] = listings.splice(idx, 1);
    return removed;
  }
}
