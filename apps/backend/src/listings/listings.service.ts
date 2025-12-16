import { Injectable } from '@nestjs/common';
import { listings, type Listing } from './listings.store';
import { CreateListingDto } from './dto/create-listing.dto';

@Injectable()
export class ListingsService {
  getAll() {
    return listings;
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
      images: dto.images?.length ? dto.images : ['placeholder.jpg'],
    };

    listings.unshift(listing);
    return listing;
  }
}
