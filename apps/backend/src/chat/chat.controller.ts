import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';

type ReqWithSession = Request & {
  session?: { userId?: unknown };
  user?: { id?: unknown };
};

function getSessionUserId(req: ReqWithSession): string | null {
  const raw = req.session?.userId ?? req.user?.id ?? null;
  if (raw === null || raw === undefined) return null;

  if (typeof raw !== 'string' && typeof raw !== 'number') return null;

  const id = String(raw).trim();
  return id ? id : null;
}

function mustString(v: unknown, field: string): string {
  if (typeof v !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }
  const s = v.trim();
  if (!s) throw new BadRequestException(`${field} is required`);
  return s;
}

function optionalString(v: unknown, field: string): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }
  const s = v.trim();
  return s ? s : undefined;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('threads')
  async getThreads(
    @Req() req: ReqWithSession,
    @Query('listingId') listingId?: string,
  ) {
    const userId = getSessionUserId(req);
    if (!userId) throw new UnauthorizedException('Not authenticated');

    // query param всегда строка или undefined — просто нормализуем
    const listingIdNormalized = listingId ? listingId.trim() : undefined;

    if (listingId !== undefined && !listingIdNormalized) {
      throw new BadRequestException('listingId must be a non-empty string');
    }

    return this.chat.getMyThreads(userId, listingIdNormalized);
  }

  @Post('threads')
  async createOrGetThread(
    @Req() req: ReqWithSession,
    @Body() body: { listingId?: unknown; tenantId?: unknown },
  ) {
    const userId = getSessionUserId(req);
    if (!userId) throw new UnauthorizedException('Not authenticated');

    const listingId = mustString(body?.listingId, 'listingId');
    const tenantId = optionalString(body?.tenantId, 'tenantId');

    return this.chat.getOrCreateThread({ userId, listingId, tenantId });
  }

  @Get('threads/:threadId/messages')
  async getMessages(
    @Req() req: ReqWithSession,
    @Param('threadId') threadId: string,
  ) {
    const userId = getSessionUserId(req);
    if (!userId) throw new UnauthorizedException('Not authenticated');

    const tid = threadId.trim();
    if (!tid) throw new BadRequestException('threadId is required');

    return this.chat.getThreadMessages({ userId, threadId: tid });
  }

  @Post('threads/:threadId/messages')
  async sendMessage(
    @Req() req: ReqWithSession,
    @Param('threadId') threadId: string,
    @Body() body: { text?: unknown },
  ) {
    const userId = getSessionUserId(req);
    if (!userId) throw new UnauthorizedException('Not authenticated');

    const tid = threadId.trim();
    if (!tid) throw new BadRequestException('threadId is required');

    const text = mustString(body?.text, 'text');

    return this.chat.sendMessage({ userId, threadId: tid, text });
  }
}
