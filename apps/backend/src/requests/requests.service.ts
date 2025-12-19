import { Injectable } from '@nestjs/common';
import { listings } from '../listings/listings.store';
import { requests, type BookingRequest, RequestStatus } from './requests.store';
import type { CreateRequestDto } from './dto/create-request.dto';
import type { UpdateRequestDto } from './dto/update-request.dto';
import { contracts, ContractStatus } from '../contracts/contracts.store';

type CreateRequestResult =
  | BookingRequest
  | null
  | 'FORBIDDEN_SELF'
  | 'DUPLICATE'
  | 'ALREADY_RENTED';

type UpdateStatusResult = BookingRequest | null | 'FORBIDDEN';

@Injectable()
export class RequestsService {
  create(
    listingId: string,
    tenantId: string,
    dto: CreateRequestDto,
  ): CreateRequestResult {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return null;

    if (listing.ownerId === tenantId) return 'FORBIDDEN_SELF';

    const hasSignedContract = contracts.some(
      (c) => c.listingId === listingId && c.status === ContractStatus.SIGNED,
    );
    if (hasSignedContract) return 'ALREADY_RENTED';

    const exists = requests.find(
      (r) =>
        r.listingId === listingId &&
        r.tenantId === tenantId &&
        r.status === RequestStatus.PENDING,
    );
    if (exists) return 'DUPLICATE';

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

  getMy(tenantId: string): BookingRequest[] {
    return requests.filter((r) => r.tenantId === tenantId);
  }

  getIncoming(ownerId: string): BookingRequest[] {
    const myListingIds = new Set(
      listings.filter((l) => l.ownerId === ownerId).map((l) => l.id),
    );
    return requests.filter((r) => myListingIds.has(r.listingId));
  }

  updateStatus(
    requestId: string,
    ownerId: string,
    dto: UpdateRequestDto,
  ): UpdateStatusResult {
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return null;

    const current = requests[idx];
    const listing = listings.find((l) => l.id === current.listingId);
    if (!listing) return null;

    if (listing.ownerId !== ownerId) return 'FORBIDDEN';

    const updated: BookingRequest = {
      ...current,
      status: dto.status,
    };

    requests[idx] = updated;
    return updated;
  }

  getById(id: string): BookingRequest | undefined {
    return requests.find((r) => r.id === id);
  }
}
