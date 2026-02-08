// apps/backend/src/reviews/reviews.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';

import type { CreateReviewDto } from './dto/create-review.dto';

export type CreateReviewResult =
  | { ok: true; reviewId: string; newRating: number; ratingCount: number }
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONTRACT_NOT_COMPLETED'
  | 'ALREADY_REVIEWED'
  | 'INVALID_TARGET';

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForContract(
    contractId: string,
    authorId: string,
    dto: CreateReviewDto,
  ): Promise<CreateReviewResult> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, status: true, ownerId: true, tenantId: true },
    });

    if (!contract) return 'NOT_FOUND';

    const isOwner = contract.ownerId === authorId;
    const isTenant = contract.tenantId === authorId;

    if (!isOwner && !isTenant) return 'FORBIDDEN';
    if (contract.status !== 'COMPLETED') return 'CONTRACT_NOT_COMPLETED';

    const targetId = isOwner ? contract.tenantId : contract.ownerId;
    if (!targetId || targetId === authorId) return 'INVALID_TARGET';

    const comment = dto.comment?.trim() ? dto.comment.trim() : null;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const created = await tx.review.create({
          data: {
            contractId: contract.id,
            authorId,
            targetId,
            rating: dto.rating,
            comment,
          },
          select: { id: true, targetId: true },
        });

        const agg = await tx.review.aggregate({
          where: { targetId: created.targetId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        const avg = Number(agg._avg.rating ?? 0);
        const newRating = round1(avg);
        const ratingCount = Number(agg._count.rating ?? 0);

        await tx.user.update({
          where: { id: created.targetId },
          data: { rating: newRating, ratingCount },
          select: { id: true },
        });

        return { reviewId: created.id, newRating, ratingCount };
      });

      return { ok: true, ...result };
    } catch (e: unknown) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') return 'ALREADY_REVIEWED';
      }
      throw e;
    }
  }

  getForUser(userId: string) {
    return this.prisma.review.findMany({
      where: { targetId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        contract: { select: { id: true, listingId: true, status: true } },
      },
    });
  }

  getAuthoredByUser(authorId: string) {
    return this.prisma.review.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      include: {
        target: { select: { id: true, firstName: true, lastName: true } },
        contract: { select: { id: true, listingId: true, status: true } },
      },
    });
  }
}
