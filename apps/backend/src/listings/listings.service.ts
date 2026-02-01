import { Injectable } from '@nestjs/common';
import { listings, type Listing } from './listings.store';
import type { CreateListingDto } from './dto/create-listing.dto';
import type { UpdateListingDto } from './dto/update-listing.dto';

type GetAllFilter = {
  cityId?: string;
};

function toISODateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

@Injectable()
export class ListingsService {
  getAll(filter: GetAllFilter = {}) {
    const cityId = filter.cityId ? Number(filter.cityId) : null;

    const res = listings.filter((l) => l.status === 'ACTIVE');

    if (!cityId) return res;
    return res.filter((l) => l.city.geonameId === cityId);
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
      status: 'ACTIVE',

      buildingType: dto.buildingType ?? 'old',
      rentType: dto.rentType ?? 'long',
      area: typeof dto.area === 'number' ? dto.area : 0,
      rooms: typeof dto.rooms === 'number' ? dto.rooms : 0,
      availableFrom: dto.availableFrom ?? toISODateOnly(new Date()),

      kitchen: Boolean(dto.kitchen),
      pets: Boolean(dto.pets),
      lift: Boolean(dto.lift),
      parking: Boolean(dto.parking),
      furnished: Boolean(dto.furnished),
      balcony: Boolean(dto.balcony),
      storage: Boolean(dto.storage),
    };

    listings.unshift(listing);
    return listing;
  }

  update(id: string, ownerId: string, dto: UpdateListingDto) {
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
      status: dto.status ?? current.status,

      buildingType: dto.buildingType ?? current.buildingType,
      rentType: dto.rentType ?? current.rentType,
      area: typeof dto.area === 'number' ? dto.area : current.area,
      rooms: typeof dto.rooms === 'number' ? dto.rooms : current.rooms,
      availableFrom: dto.availableFrom ?? current.availableFrom,

      kitchen: typeof dto.kitchen === 'boolean' ? dto.kitchen : current.kitchen,
      pets: typeof dto.pets === 'boolean' ? dto.pets : current.pets,
      lift: typeof dto.lift === 'boolean' ? dto.lift : current.lift,
      parking: typeof dto.parking === 'boolean' ? dto.parking : current.parking,
      furnished:
        typeof dto.furnished === 'boolean' ? dto.furnished : current.furnished,
      balcony: typeof dto.balcony === 'boolean' ? dto.balcony : current.balcony,
      storage: typeof dto.storage === 'boolean' ? dto.storage : current.storage,
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
