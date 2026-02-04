import { Injectable } from '@nestjs/common';
import type { CreateListingDto } from './dto/create-listing.dto';
import type { UpdateListingDto } from './dto/update-listing.dto';
import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';

type GetAllFilter = {
  cityId?: string;
};

export type OwnerPublic = {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
};

export type ListingStatus = 'ACTIVE' | 'HIDDEN';

type ListingRow = Prisma.ListingGetPayload<Record<string, never>>;

export type ListingDb = {
  id: string;
  ownerId: string;

  title: string;
  description: string | null;
  images: string[];

  address: string | null;
  city: Prisma.JsonValue;
  price: number;
  area: number | null;
  rooms: number | null;

  status: ListingStatus;

  buildingType: string | null;
  rentType: string | null;
  availableFrom: Date | null;

  kitchen: boolean;
  pets: boolean;
  lift: boolean;
  parking: boolean;
  furnished: boolean;
  balcony: boolean;
  storage: boolean;

  createdAt: Date;
  updatedAt: Date;
};

function parseCityId(cityId?: string): number | null {
  if (!cityId) return null;
  const n = Number(cityId);
  return Number.isFinite(n) ? n : null;
}

function hasOwnKey<K extends string>(
  obj: unknown,
  key: K,
): obj is Record<K, unknown> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Object.prototype.hasOwnProperty.call(obj, key)
  );
}

type PresentField = { present: false } | { present: true; value: unknown };

function getField<K extends string>(obj: unknown, key: K): PresentField {
  if (!hasOwnKey(obj, key)) return { present: false };
  return { present: true, value: obj[key] };
}

function dateOrNull(v: unknown): Date | null {
  if (v == null) return null;

  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : v;
  }

  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return {} as Prisma.InputJsonValue;
  }
}

function patchNullableNumber(
  dto: UpdateListingDto,
  key: 'area' | 'rooms',
  current: number | null,
): number | null {
  const f = getField(dto, key);
  if (!f.present) return current;

  const v = f.value;
  if (typeof v === 'number') return v;
  if (v === null) return null;

  return current;
}

function patchBoolean(
  dto: UpdateListingDto,
  key:
    | 'kitchen'
    | 'pets'
    | 'lift'
    | 'parking'
    | 'furnished'
    | 'balcony'
    | 'storage',
  current: boolean,
): boolean {
  const f = getField(dto, key);
  if (!f.present) return current;
  return typeof f.value === 'boolean' ? f.value : current;
}

function patchString(
  dto: UpdateListingDto,
  key: 'title',
  current: string,
): string {
  const f = getField(dto, key);
  if (!f.present) return current;
  return typeof f.value === 'string' ? f.value : current;
}

function patchNumber(dto: UpdateListingDto, key: 'price', current: number) {
  const f = getField(dto, key);
  if (!f.present) return current;
  return typeof f.value === 'number' ? f.value : current;
}

function patchNullableString(
  dto: UpdateListingDto,
  key: 'address' | 'description' | 'buildingType' | 'rentType',
  current: string | null,
): string | null {
  const f = getField(dto, key);
  if (!f.present) return current;

  const v = f.value;
  if (typeof v === 'string') return v;
  if (v === null) return null;

  return current;
}

function patchStringArray(
  dto: UpdateListingDto,
  key: 'images',
  current: string[],
): string[] {
  const f = getField(dto, key);
  if (!f.present) return current;

  const v = f.value;
  if (!Array.isArray(v)) return current;

  return v.filter((x): x is string => typeof x === 'string');
}

function patchStatus(
  dto: UpdateListingDto,
  key: 'status',
  current: ListingStatus,
): ListingStatus {
  const f = getField(dto, key);
  if (!f.present) return current;
  return f.value === 'ACTIVE' || f.value === 'HIDDEN' ? f.value : current;
}

function patchCity(
  dto: UpdateListingDto,
  key: 'city',
  current: Prisma.JsonValue,
): Prisma.InputJsonValue {
  const f = getField(dto, key);
  if (!f.present) return toInputJson(current);
  return toInputJson(f.value);
}

@Injectable()
export class ListingsService {
  async getOwnersMap(
    ownerIds: Array<string | null | undefined>,
  ): Promise<Map<string, OwnerPublic>> {
    const ids = Array.from(
      new Set(ownerIds.filter((x): x is string => Boolean(x))),
    );
    if (ids.length === 0) return new Map();

    const users: OwnerPublic[] = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, firstName: true, lastName: true, rating: true },
    });

    return new Map(users.map((u): [string, OwnerPublic] => [u.id, u]));
  }

  async getAll(filter: GetAllFilter = {}): Promise<ListingDb[]> {
    const cityId = parseCityId(filter.cityId);

    const cityWhere = cityId
      ? ({
          city: {
            path: ['geonameId'],
            equals: cityId,
          },
        } as const)
      : {};

    const items = await prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        ...cityWhere,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items as unknown as ListingDb[];
  }

  async getById(id: string): Promise<ListingDb | null> {
    const item = await prisma.listing.findUnique({ where: { id } });
    return (item as unknown as ListingDb) ?? null;
  }

  async getByOwner(ownerId: string): Promise<ListingDb[]> {
    const items = await prisma.listing.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    return items as unknown as ListingDb[];
  }

  async create(ownerId: string, dto: CreateListingDto): Promise<ListingDb> {
    const created = await prisma.listing.create({
      data: {
        ownerId,

        title: dto.title,
        description: dto.description ?? null,
        images: dto.images ?? [],

        city: toInputJson(dto.city),

        address: dto.address ?? null,
        price: dto.price,

        area: typeof dto.area === 'number' ? dto.area : null,
        rooms: typeof dto.rooms === 'number' ? dto.rooms : null,

        status: 'ACTIVE',

        buildingType: dto.buildingType ?? null,
        rentType: dto.rentType ?? null,
        availableFrom: dto.availableFrom ? dateOrNull(dto.availableFrom) : null,

        kitchen: dto.kitchen ?? false,
        pets: dto.pets ?? false,
        lift: dto.lift ?? false,
        parking: dto.parking ?? false,
        furnished: dto.furnished ?? false,
        balcony: dto.balcony ?? false,
        storage: dto.storage ?? false,
      },
    });

    return created as unknown as ListingDb;
  }

  async update(
    id: string,
    ownerId: string,
    dto: UpdateListingDto,
  ): Promise<ListingDb | null | 'FORBIDDEN'> {
    const current = (await prisma.listing.findUnique({
      where: { id },
    })) as ListingRow | null;

    if (!current) return null;
    if (current.ownerId !== ownerId) return 'FORBIDDEN';

    const availableFromField = getField(dto, 'availableFrom');

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        title: patchString(dto, 'title', current.title),

        city: patchCity(dto, 'city', current.city),

        address: patchNullableString(dto, 'address', current.address),
        description: patchNullableString(
          dto,
          'description',
          current.description,
        ),
        price: patchNumber(dto, 'price', current.price),
        images: patchStringArray(dto, 'images', current.images),

        status: patchStatus(dto, 'status', current.status as ListingStatus),

        buildingType: patchNullableString(
          dto,
          'buildingType',
          current.buildingType,
        ),
        rentType: patchNullableString(dto, 'rentType', current.rentType),

        area: patchNullableNumber(dto, 'area', current.area),
        rooms: patchNullableNumber(dto, 'rooms', current.rooms),

        availableFrom: availableFromField.present
          ? dateOrNull(availableFromField.value)
          : current.availableFrom,

        kitchen: patchBoolean(dto, 'kitchen', current.kitchen),
        pets: patchBoolean(dto, 'pets', current.pets),
        lift: patchBoolean(dto, 'lift', current.lift),
        parking: patchBoolean(dto, 'parking', current.parking),
        furnished: patchBoolean(dto, 'furnished', current.furnished),
        balcony: patchBoolean(dto, 'balcony', current.balcony),
        storage: patchBoolean(dto, 'storage', current.storage),
      },
    });

    return updated as unknown as ListingDb;
  }

  async delete(
    id: string,
    ownerId: string,
  ): Promise<ListingDb | null | 'FORBIDDEN'> {
    const current = await prisma.listing.findUnique({ where: { id } });
    if (!current) return null;

    if (current.ownerId !== ownerId) return 'FORBIDDEN';

    const removed = await prisma.listing.delete({ where: { id } });
    return removed as unknown as ListingDb;
  }
}
