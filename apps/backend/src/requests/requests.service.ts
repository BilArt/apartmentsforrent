import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { prisma } from '../db/prisma';
import type { CreateRequestDto } from './dto/create-request.dto';
import type { UpdateRequestDto } from './dto/update-request.dto';

const db: typeof prisma = prisma;

export type UserPublic = {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
};

const ALLOWED_REQUEST_STATUS = new Set([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
] as const);

export type RequestStatusLiteral =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

function toRequestStatusLiteral(v: unknown): RequestStatusLiteral | null {
  if (typeof v !== 'string') return null;
  return ALLOWED_REQUEST_STATUS.has(v as RequestStatusLiteral)
    ? (v as RequestStatusLiteral)
    : null;
}

const ALLOWED_TRANSITIONS: Record<
  RequestStatusLiteral,
  RequestStatusLiteral[]
> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['COMPLETED', 'REJECTED'],
  REJECTED: [],
  COMPLETED: [],
};

function canTransition(from: RequestStatusLiteral, to: RequestStatusLiteral) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

type CreateRequestResult =
  | { ok: true; requestId: string }
  | 'NOT_FOUND'
  | 'FORBIDDEN_SELF'
  | 'DUPLICATE'
  | 'ALREADY_RENTED'
  | 'INVALID_DATES';

type UpdateStatusResult =
  | { ok: true; requestId: string }
  | 'NOT_FOUND'
  | 'FORBIDDEN';

export type RequestWithDetails = Awaited<
  ReturnType<RequestsService['getById']>
>;

function parseDateLike(value: unknown): Date | null {
  if (value == null) return null;
  if (typeof value !== 'string') return null;

  const v = value.trim();
  if (!v) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = new Date(`${v}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

@Injectable()
export class RequestsService {
  async create(
    listingId: string,
    tenantId: string,
    dto: CreateRequestDto,
  ): Promise<CreateRequestResult> {
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { id: true, ownerId: true },
    });
    if (!listing) return 'NOT_FOUND';

    if (listing.ownerId === tenantId) return 'FORBIDDEN_SELF';

    const hasSignedContract = await db.contract.findFirst({
      where: { listingId, status: 'SIGNED' },
      select: { id: true },
    });
    if (hasSignedContract) return 'ALREADY_RENTED';

    const from = parseDateLike(dto.from);
    const to = parseDateLike(dto.to);

    if ((from && !to) || (!from && to)) return 'INVALID_DATES';

    if (from && to && from.getTime() > to.getTime()) return 'INVALID_DATES';

    const existingActive = await db.bookingRequest.findFirst({
      where: {
        listingId,
        tenantId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: { id: true },
    });
    if (existingActive) return 'DUPLICATE';

    try {
      const created = await db.bookingRequest.create({
        data: {
          listingId,
          tenantId,
          status: 'PENDING',
          message: dto.message ?? null,
          from: from ?? null,
          to: to ?? null,
        },
        select: { id: true },
      });

      return { ok: true, requestId: created.id };
    } catch (e: unknown) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        return 'DUPLICATE';
      }
      throw e;
    }
  }

  getMy(tenantId: string) {
    return db.bookingRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { id: true, firstName: true, lastName: true, rating: true },
        },
        listing: true,
      },
    });
  }

  getIncoming(ownerId: string) {
    return db.bookingRequest.findMany({
      where: { listing: { ownerId } },
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { id: true, firstName: true, lastName: true, rating: true },
        },
        listing: true,
      },
    });
  }

  async updateStatus(
    requestId: string,
    ownerId: string,
    dto: UpdateRequestDto,
  ): Promise<UpdateStatusResult> {
    const nextStatus = toRequestStatusLiteral(dto.status);
    if (!nextStatus) return 'FORBIDDEN';

    return db.$transaction(async (tx) => {
      const req = await tx.bookingRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          listingId: true,
          tenantId: true,
          status: true,
          from: true,
          to: true,
        },
      });
      if (!req) return 'NOT_FOUND';

      const listing = await tx.listing.findUnique({
        where: { id: req.listingId },
        select: { ownerId: true },
      });
      if (!listing) return 'NOT_FOUND';
      if (listing.ownerId !== ownerId) return 'FORBIDDEN';

      const currentStatus = toRequestStatusLiteral(req.status);
      if (!currentStatus) return 'FORBIDDEN';

      if (!canTransition(currentStatus, nextStatus)) return 'FORBIDDEN';

      if (nextStatus === 'APPROVED') {
        await tx.bookingRequest.update({
          where: { id: req.id },
          data: { status: 'APPROVED' },
          select: { id: true },
        });

        await tx.bookingRequest.updateMany({
          where: {
            listingId: req.listingId,
            status: 'PENDING',
            NOT: { id: req.id },
          },
          data: { status: 'REJECTED' },
        });

        try {
          await tx.contract.create({
            data: {
              listingId: req.listingId,
              ownerId: listing.ownerId,
              tenantId: req.tenantId,
              status: 'SIGNED',
              from: req.from ?? null,
              to: req.to ?? null,
            },
            select: { id: true },
          });
        } catch (e: unknown) {
          if (e instanceof PrismaClientKnownRequestError) {
            const meta = e.meta as { constraint?: string } | undefined;
            if (
              e.code === 'P2002' ||
              meta?.constraint === 'uniq_contract_signed_per_listing'
            ) {
              return 'FORBIDDEN';
            }
          }
          throw e;
        }

        return { ok: true, requestId: req.id };
      }

      if (nextStatus === 'COMPLETED') {
        const updated = await tx.bookingRequest.update({
          where: { id: req.id },
          data: { status: 'COMPLETED' },
          select: { id: true },
        });

        await tx.contract.updateMany({
          where: { listingId: req.listingId, status: 'SIGNED' },
          data: { status: 'COMPLETED' },
        });

        return { ok: true, requestId: updated.id };
      }

      if (nextStatus === 'REJECTED') {
        const updated = await tx.bookingRequest.update({
          where: { id: req.id },
          data: { status: 'REJECTED' },
          select: { id: true },
        });

        if (currentStatus === 'APPROVED') {
          await tx.contract.updateMany({
            where: { listingId: req.listingId, status: 'SIGNED' },
            data: { status: 'CANCELLED' },
          });
        }

        return { ok: true, requestId: updated.id };
      }

      const updated = await tx.bookingRequest.update({
        where: { id: req.id },
        data: { status: nextStatus },
        select: { id: true },
      });

      return { ok: true, requestId: updated.id };
    });
  }

  getById(id: string) {
    return db.bookingRequest.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, firstName: true, lastName: true, rating: true },
        },
        listing: true,
      },
    });
  }
}
