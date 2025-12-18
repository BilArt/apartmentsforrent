import { Injectable } from '@nestjs/common';
import { listings } from '../listings/listings.store';
import { requests, RequestStatus } from '../requests/requests.store';
import { contracts, type Contract, ContractStatus } from './contracts.store';

@Injectable()
export class ContractsService {
  createFromRequest(requestId: string, ownerId: string) {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return null;

    const listing = listings.find((l) => l.id === req.listingId);
    if (!listing) return null;

    if (listing.ownerId !== ownerId) return 'FORBIDDEN' as const;

    if (req.status !== RequestStatus.APPROVED) return 'NOT_APPROVED' as const;

    const exists = contracts.find((c) => c.requestId === requestId);
    if (exists) return 'DUPLICATE' as const;

    const contract: Contract = {
      id: crypto.randomUUID(),
      requestId: req.id,
      listingId: req.listingId,
      ownerId: listing.ownerId,
      tenantId: req.tenantId,
      price: listing.price,
      from: req.from,
      to: req.to,
      status: ContractStatus.DRAFT,
      createdAt: new Date().toISOString(),
    };

    contracts.unshift(contract);
    return contract;
  }

  getMy(userId: string) {
    return contracts.filter(
      (c) => c.ownerId === userId || c.tenantId === userId,
    );
  }

  updateStatus(contractId: string, userId: string, status: ContractStatus) {
    const idx = contracts.findIndex((c) => c.id === contractId);
    if (idx === -1) return null;

    const current = contracts[idx];
    const isParticipant =
      current.ownerId === userId || current.tenantId === userId;
    if (!isParticipant) return 'FORBIDDEN' as const;

    if (status === ContractStatus.SIGNED && current.tenantId !== userId) {
      return 'FORBIDDEN_SIGN' as const;
    }

    const updated: Contract = { ...current, status };
    contracts[idx] = updated;
    return updated;
  }
}
