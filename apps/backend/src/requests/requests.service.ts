import { Injectable } from '@nestjs/common';
import { listings } from '../listings/listings.store';
import { requests, type BookingRequest, RequestStatus } from './requests.store';
import type { CreateRequestDto } from './dto/create-request.dto';
import type { UpdateRequestDto } from './dto/update-request.dto';

@Injectable()
export class RequestsService {
  create(listingId: string, tenantId: string, dto: CreateRequestDto) {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return null;

    if (listing.ownerId === tenantId) return 'FORBIDDEN_SELF' as const;

    const exists = requests.find(
      (r) =>
        r.listingId === listingId &&
        r.tenantId === tenantId &&
        r.status === RequestStatus.PENDING,
    );
    if (exists) return 'DUPLICATE' as const;

    const req: BookingRequest = {
      id: crypto.randomUUID(),
      listingId,
      tenantId,
      status: RequestStatus.PENDING,
      message: dto.message,
      from: dto.from,
      to: dto.to,
      createdAt: new Date().toISOString(),
    };

    requests.unshift(req);
    return req;
  }

  getMy(tenantId: string) {
    return requests.filter((r) => r.tenantId === tenantId);
  }

  getIncoming(ownerId: string) {
    const myListingIds = new Set(
      listings.filter((l) => l.ownerId === ownerId).map((l) => l.id),
    );
    return requests.filter((r) => myListingIds.has(r.listingId));
  }

  updateStatus(requestId: string, ownerId: string, dto: UpdateRequestDto) {
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return null;

    const current = requests[idx];
    const listing = listings.find((l) => l.id === current.listingId);
    if (!listing) return null;

    if (listing.ownerId !== ownerId) return 'FORBIDDEN' as const;

    const updated: BookingRequest = {
      ...current,
      status: dto.status,
    };

    requests[idx] = updated;
    return updated;
  }

  getById(id: string) {
    return requests.find((r) => r.id === id);
  }
}
