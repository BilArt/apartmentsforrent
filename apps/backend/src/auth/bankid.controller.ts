import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import {
  exchangeCodeForToken,
  getUserInfo,
  makeNonce,
  makeState,
  type BankIdProvider,
} from './bankid.store';

function safeProvider(v: string | undefined): BankIdProvider {
  return v === 'privat' ? 'privat' : 'mono';
}

@Controller('auth/bankid')
export class BankIdController {
  @Get('start')
  start(
    @Req() req: Request,
    @Query('provider') provider?: string,
    @Query('returnTo') returnTo?: string,
    @Res() res?: Response,
  ) {
    if (!res) return;

    const prov = safeProvider(provider);
    const state = makeState();
    const nonce = makeNonce();

    req.session.bankIdState = state;
    req.session.bankIdNonce = nonce;
    req.session.bankIdReturnTo = String(returnTo || '/').trim() || '/';

    const base = `${req.protocol}://${req.get('host')}`;

    const callbackUrl = new URL('/auth/bankid/callback', base);

    const authorizeUrl = new URL('/mock-bankid/authorize', base);
    authorizeUrl.searchParams.set('redirect_uri', callbackUrl.toString());
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('nonce', nonce);
    authorizeUrl.searchParams.set('provider', prov);

    res.redirect(authorizeUrl.toString());
  }

  @Get('callback')
  async callback(
    @Req() req: Request,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Res() res?: Response,
  ) {
    if (!res) return;

    const expectedState = req.session.bankIdState;
    const returnTo = req.session.bankIdReturnTo || '/';

    if (!code || !state || !expectedState || state !== expectedState) {
      return res.status(400).send('BankID callback failed: invalid state/code');
    }

    const token = exchangeCodeForToken(code);
    const { provider, claims } = getUserInfo(token.access_token);

    const bankId = `${provider}:${claims.sub}`;

    const existing = await prisma.user.findUnique({
      where: { bankId },
      select: { id: true },
    });

    let userId: string;

    if (existing) {
      userId = existing.id;
    } else {
      const created = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          bankId,
          firstName: claims.firstName,
          lastName: claims.lastName,
          phone: claims.phone,
          rating: 0,
        },
        select: { id: true },
      });
      userId = created.id;
    }

    req.session.userId = userId;

    req.session.bankIdState = undefined;
    req.session.bankIdNonce = undefined;
    req.session.bankIdReturnTo = undefined;

    return res.redirect(returnTo);
  }

  @Get('cancel')
  cancel(@Req() req: Request, @Res() res: Response) {
    const returnTo = req.session.bankIdReturnTo || '/';

    req.session.bankIdState = undefined;
    req.session.bankIdNonce = undefined;
    req.session.bankIdReturnTo = undefined;

    return res.redirect(String(returnTo || '/'));
  }
}
