import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';

function isPrismaUniqueError(e: unknown): e is PrismaClientKnownRequestError {
  return e instanceof PrismaClientKnownRequestError && e.code === 'P2002';
}

const THREAD_INCLUDE = {
  listing: { select: { id: true, title: true } },
  owner: {
    select: { id: true, firstName: true, lastName: true, rating: true },
  },
  tenant: {
    select: { id: true, firstName: true, lastName: true, rating: true },
  },
  messages: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    select: { id: true, text: true, createdAt: true, authorId: true },
  },
} satisfies Prisma.ChatThreadInclude;

type ThreadRow = Prisma.ChatThreadGetPayload<{
  include: typeof THREAD_INCLUDE;
}>;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyThreads(userId: string, listingId?: string) {
    const where: Prisma.ChatThreadWhereInput = {
      OR: [{ ownerId: userId }, { tenantId: userId }],
      ...(listingId ? { listingId } : {}),
    };

    const threads = await this.prisma.chatThread.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: THREAD_INCLUDE,
    });

    return threads.map((t: ThreadRow) => ({
      id: t.id,
      listingId: t.listingId,
      ownerId: t.ownerId,
      tenantId: t.tenantId,
      updatedAt: t.updatedAt,
      createdAt: t.createdAt,
      listing: t.listing,
      owner: t.owner,
      tenant: t.tenant,
      lastMessage: t.messages?.[0] ?? null,
    }));
  }

  async getOrCreateThread(params: {
    userId: string;
    listingId: string;
    tenantId?: string;
  }) {
    const userId = String(params.userId);
    const listingId = String(params.listingId);

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, ownerId: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const ownerId = String(listing.ownerId);
    const isOwner = ownerId === userId;

    const tenantId = !isOwner
      ? userId
      : params.tenantId
        ? String(params.tenantId)
        : (() => {
            throw new ForbiddenException(
              'Owner must provide tenantId to open chat',
            );
          })();

    if (tenantId === ownerId) {
      throw new ForbiddenException('Cannot create chat with yourself');
    }

    const existing = await this.prisma.chatThread.findUnique({
      where: { listingId_tenantId: { listingId, tenantId } },
      include: {
        listing: { select: { id: true, title: true } },
        owner: {
          select: { id: true, firstName: true, lastName: true, rating: true },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true, rating: true },
        },
      },
    });
    if (existing) return existing;

    try {
      return await this.prisma.chatThread.create({
        data: { listingId, ownerId, tenantId },
        include: {
          listing: { select: { id: true, title: true } },
          owner: {
            select: { id: true, firstName: true, lastName: true, rating: true },
          },
          tenant: {
            select: { id: true, firstName: true, lastName: true, rating: true },
          },
        },
      });
    } catch (e: unknown) {
      if (isPrismaUniqueError(e)) {
        const again = await this.prisma.chatThread.findUnique({
          where: { listingId_tenantId: { listingId, tenantId } },
          include: {
            listing: { select: { id: true, title: true } },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                rating: true,
              },
            },
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                rating: true,
              },
            },
          },
        });
        if (again) return again;
      }
      throw e;
    }
  }

  async getThreadMessages(params: { userId: string; threadId: string }) {
    const userId = String(params.userId);
    const threadId = String(params.threadId);

    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      select: { id: true, ownerId: true, tenantId: true },
    });
    if (!thread) throw new NotFoundException('Thread not found');

    const isMember = thread.ownerId === userId || thread.tenantId === userId;
    if (!isMember) throw new ForbiddenException('No access to this thread');

    const messages = await this.prisma.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, rating: true },
        },
      },
    });

    return messages.map((m) => ({
      id: m.id,
      threadId: m.threadId,
      authorId: m.authorId,
      text: m.text,
      createdAt: m.createdAt,
      author: m.author,
    }));
  }

  async sendMessage(params: {
    userId: string;
    threadId: string;
    text: string;
  }) {
    const userId = String(params.userId);
    const threadId = String(params.threadId);
    const text = String(params.text ?? '').trim();

    if (!text) throw new BadRequestException('Message text is empty');

    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      select: { id: true, ownerId: true, tenantId: true },
    });
    if (!thread) throw new NotFoundException('Thread not found');

    const isMember = thread.ownerId === userId || thread.tenantId === userId;
    if (!isMember) throw new ForbiddenException('No access to this thread');

    const msg = await this.prisma.chatMessage.create({
      data: { threadId, authorId: userId, text },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, rating: true },
        },
      },
    });

    // дернем updatedAt чтобы тред всплывал наверх
    await this.prisma.chatThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return {
      id: msg.id,
      threadId: msg.threadId,
      authorId: msg.authorId,
      text: msg.text,
      createdAt: msg.createdAt,
      author: msg.author,
    };
  }
}
