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

type BankIdIntent = 'signin' | 'signup';

type BankIdSession = {
  userId?: string;
  bankIdState?: string;
  bankIdNonce?: string;
  bankIdReturnTo?: string;
  bankIdIntent?: BankIdIntent;
};

function safeProvider(v: string | undefined): BankIdProvider {
  return v === 'privat' ? 'privat' : 'mono';
}

function safeIntent(v: string | undefined): BankIdIntent {
  return v === 'signup' ? 'signup' : 'signin';
}

function baseUrl(req: Request) {
  return `${req.protocol}://${req.get('host')}`;
}

@Controller('auth/bankid')
export class BankIdController {
  @Get('start')
  start(
    @Req() req: Request,
    @Query('provider') provider?: string,
    @Query('returnTo') returnTo?: string,
    @Query('intent') intent?: string,
    @Res() res?: Response,
  ) {
    if (!res) return;

    const session = req.session as unknown as BankIdSession;

    const prov = safeProvider(provider);
    const flow = safeIntent(intent);

    const state = makeState();
    const nonce = makeNonce();

    session.bankIdState = state;
    session.bankIdNonce = nonce;
    session.bankIdReturnTo = String(returnTo || '/').trim() || '/';
    session.bankIdIntent = flow;

    const base = baseUrl(req);

    const callbackUrl = new URL('/auth/bankid/callback', base);

    const authorizeUrl = new URL('/mock-bankid/authorize', base);
    authorizeUrl.searchParams.set('redirect_uri', callbackUrl.toString());
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('nonce', nonce);
    authorizeUrl.searchParams.set('provider', prov);
    authorizeUrl.searchParams.set('intent', flow);

    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(authorizeUrl.toString());
  }

  @Get('callback')
  async callback(
    @Req() req: Request,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Res() res?: Response,
  ) {
    if (!res) return;

    const session = req.session as unknown as BankIdSession;

    const expectedState = session.bankIdState;
    const returnTo = String(session.bankIdReturnTo || '/');
    const flow: BankIdIntent =
      session.bankIdIntent === 'signup' ? 'signup' : 'signin';

    if (!code || !state || !expectedState || state !== expectedState) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(400).send('BankID callback failed: invalid state/code');
    }

    session.bankIdState = undefined;
    session.bankIdNonce = undefined;
    session.bankIdReturnTo = undefined;
    session.bankIdIntent = undefined;

    try {
      const token = exchangeCodeForToken(code);
      const { provider, claims } = getUserInfo(token.access_token);

      const bankId = `${provider}:${claims.sub}`;

      const existing = await prisma.user.findUnique({
        where: { bankId },
        select: { id: true, bankIdVerified: true },
      });

      if (flow === 'signin') {
        if (!existing) {
          const url = new URL(returnTo, baseUrl(req));
          url.searchParams.set('authError', 'bankid_no_account');
          res.setHeader('Cache-Control', 'no-store');
          return res.redirect(url.toString());
        }

        if (!existing.bankIdVerified) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { bankIdVerified: true, bankIdVerifiedAt: new Date() },
            select: { id: true },
          });
        }

        session.userId = existing.id;
        res.setHeader('Cache-Control', 'no-store');
        return res.redirect(returnTo);
      }

      let userId: string;

      if (existing) {
        userId = existing.id;

        if (!existing.bankIdVerified) {
          await prisma.user.update({
            where: { id: userId },
            data: { bankIdVerified: true, bankIdVerifiedAt: new Date() },
            select: { id: true },
          });
        }
      } else {
        const created = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            bankId,
            firstName: claims.firstName,
            lastName: claims.lastName,
            phone: claims.phone,
            rating: 0,
            bankIdVerified: true,
            bankIdVerifiedAt: new Date(),
          },
          select: { id: true },
        });
        userId = created.id;
      }

      session.userId = userId;
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(returnTo);
    } catch {
      const url = new URL(returnTo, baseUrl(req));
      url.searchParams.set('authError', 'bankid_failed');
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(url.toString());
    }
  }

  @Get('cancel')
  cancel(@Req() req: Request, @Res() res: Response) {
    const session = req.session as unknown as BankIdSession;

    const returnTo = session.bankIdReturnTo || '/';

    session.bankIdState = undefined;
    session.bankIdNonce = undefined;
    session.bankIdReturnTo = undefined;
    session.bankIdIntent = undefined;

    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(String(returnTo || '/'));
  }
}
