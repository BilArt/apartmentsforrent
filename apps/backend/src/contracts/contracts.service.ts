import { Injectable } from '@nestjs/common';
import { listings } from '../listings/listings.store';
import { requests, RequestStatus } from '../requests/requests.store';
import { ContractStatus, contracts, type Contract } from './contracts.store';
import type { UpdateContractDto } from './dto/update-contract.dto';

type CreateFromRequestResult =
  | Contract
  | null
  | 'FORBIDDEN'
  | 'REQUEST_NOT_APPROVED'
  | 'ALREADY_EXISTS';

type UpdateStatusResult = Contract | null | 'FORBIDDEN' | 'INVALID_TRANSITION';

@Injectable()
export class ContractsService {
  createFromRequest(
    requestId: string,
    ownerId: string,
  ): CreateFromRequestResult {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return null;

    const listing = listings.find((l) => l.id === req.listingId);
    if (!listing) return null;

    if (listing.ownerId !== ownerId) return 'FORBIDDEN';
    if (req.status !== RequestStatus.APPROVED) return 'REQUEST_NOT_APPROVED';

    const exists = contracts.find((c) => c.requestId === requestId);
    if (exists) return 'ALREADY_EXISTS';

    const from = req.from ?? new Date().toISOString().slice(0, 10);
    const to = req.to ?? new Date().toISOString().slice(0, 10);

    const contract: Contract = {
      id: crypto.randomUUID(),
      requestId,
      listingId: req.listingId,
      ownerId: listing.ownerId,
      tenantId: req.tenantId,
      price: listing.price,
      from,
      to,
      status: ContractStatus.DRAFT,
      createdAt: new Date().toISOString(),
    };

    contracts.unshift(contract);
    return contract;
  }

  getMy(userId: string): Contract[] {
    return contracts.filter(
      (c) => c.ownerId === userId || c.tenantId === userId,
    );
  }

  updateStatus(
    contractId: string,
    userId: string,
    dto: UpdateContractDto,
  ): UpdateStatusResult {
    const idx = contracts.findIndex((c) => c.id === contractId);
    if (idx === -1) return null;

    const current = contracts[idx];
    const next = dto.status;

    const isOwner = current.ownerId === userId;
    const isTenant = current.tenantId === userId;
    if (!isOwner && !isTenant) return 'FORBIDDEN';

    const allowed =
      (isTenant &&
        current.status === ContractStatus.DRAFT &&
        next === ContractStatus.SIGNED_BY_TENANT) ||
      (isOwner &&
        current.status === ContractStatus.SIGNED_BY_TENANT &&
        next === ContractStatus.SIGNED) ||
      ((isOwner || isTenant) &&
        current.status !== ContractStatus.SIGNED &&
        next === ContractStatus.CANCELLED);

    if (!allowed) return 'INVALID_TRANSITION';

    const updated: Contract = { ...current, status: next };
    contracts[idx] = updated;

    if (
      current.status !== ContractStatus.SIGNED &&
      next === ContractStatus.SIGNED
    ) {
      const rIdx = requests.findIndex((r) => r.id === current.requestId);
      if (rIdx !== -1) {
        requests[rIdx] = { ...requests[rIdx], status: RequestStatus.COMPLETED };
      }
    }

    return updated;
  }

  getById(id: string): Contract | undefined {
    return contracts.find((c) => c.id === id);
  }
}
