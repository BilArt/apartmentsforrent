import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ContractStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateContractDto } from './dto/update-contract.dto';

type CreateFromRequestResult =
  | { ok: true; contractId: string }
  | null
  | 'FORBIDDEN'
  | 'REQUEST_NOT_APPROVED'
  | 'ALREADY_EXISTS';

type UpdateStatusResult =
  | { ok: true; status: ContractStatus }
  | null
  | 'FORBIDDEN'
  | 'INVALID_TRANSITION'
  | 'ACTIVE_CONTRACT_EXISTS';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromRequest(
    requestId: string,
    ownerId: string,
  ): Promise<CreateFromRequestResult> {
    const req = await this.prisma.bookingRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        from: true,
        to: true,
        tenantId: true,
        listing: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!req) return null;
    if (req.listing.ownerId !== ownerId) return 'FORBIDDEN';
    if (req.status !== 'APPROVED') return 'REQUEST_NOT_APPROVED';

    const exists = await this.prisma.contract.findFirst({
      where: {
        listingId: req.listing.id,
        tenantId: req.tenantId,
        status: { in: ['DRAFT', 'SIGNED', 'COMPLETED'] },
      },
      select: { id: true },
    });

    if (exists) return 'ALREADY_EXISTS';

    const created = await this.prisma.contract.create({
      data: {
        listingId: req.listing.id,
        ownerId,
        tenantId: req.tenantId,
        status: 'DRAFT',
        activeKey: null,
        from: req.from ?? null,
        to: req.to ?? null,
      },
      select: { id: true },
    });

    return { ok: true, contractId: created.id };
  }

  async getMy(userId: string) {
    return this.prisma.contract.findMany({
      where: {
        OR: [{ ownerId: userId }, { tenantId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        ownerId: true,
        tenantId: true,
        listingId: true,
        createdAt: true,
        reviews: {
          select: { id: true, authorId: true, targetId: true, rating: true },
        },
      },
    });
  }

  async updateStatus(
    contractId: string,
    userId: string,
    dto: UpdateContractDto,
  ): Promise<UpdateStatusResult> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        listingId: true,
        status: true,
        ownerId: true,
        tenantId: true,
      },
    });

    if (!contract) return null;

    const isOwner = contract.ownerId === userId;
    const isTenant = contract.tenantId === userId;
    if (!isOwner && !isTenant) return 'FORBIDDEN';

    const next: ContractStatus = dto.status;

    const allowed =
      (isOwner && contract.status === 'DRAFT' && next === 'SIGNED') ||
      ((isOwner || isTenant) &&
        contract.status === 'SIGNED' &&
        next === 'COMPLETED') ||
      ((isOwner || isTenant) &&
        (contract.status === 'DRAFT' || contract.status === 'SIGNED') &&
        next === 'CANCELLED');

    if (!allowed) return 'INVALID_TRANSITION';

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const data: Prisma.ContractUpdateArgs['data'] = { status: next };

        if (contract.status !== 'SIGNED' && next === 'SIGNED') {
          data.activeKey = contract.listingId;
        }
        if (contract.status === 'SIGNED' && next !== 'SIGNED') {
          data.activeKey = null;
        }

        const u = await tx.contract.update({
          where: { id: contract.id },
          data,
          select: { status: true },
        });

        return u;
      });

      return { ok: true, status: updated.status };
    } catch (e: unknown) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') return 'ACTIVE_CONTRACT_EXISTS';
      }
      throw e;
    }
  }
}
