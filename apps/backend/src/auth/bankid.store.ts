import crypto from 'node:crypto';

export type BankIdProvider = 'mono' | 'privat';

export type MockClaims = {
  sub: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export type TokenResponse = {
  access_token: string;
  id_token: string;
  token_type: 'Bearer';
  expires_in: number;
};

const codeToClaims = new Map<
  string,
  { provider: BankIdProvider; claims: MockClaims; createdAt: number }
>();

const accessToClaims = new Map<
  string,
  { provider: BankIdProvider; claims: MockClaims; createdAt: number }
>();

const CODE_TTL_MS = 2 * 60 * 1000; // 2 минуты (можно 0, если не надо)
const ACCESS_TTL_MS = 2 * 60 * 1000; // 2 минуты для mock-аксесса
const EXPIRES_IN_SEC = 600;

export function makeState() {
  return crypto.randomBytes(16).toString('hex');
}

export function makeNonce() {
  return crypto.randomBytes(16).toString('hex');
}

export function issueAuthCode(provider: BankIdProvider, claims: MockClaims) {
  const code = crypto.randomBytes(16).toString('hex');
  codeToClaims.set(code, { provider, claims, createdAt: Date.now() });
  return code;
}

export function exchangeCodeForToken(code: string): TokenResponse {
  const entry = codeToClaims.get(code);

  if (!entry) {
    const err = new Error('invalid_code');
    // @ts-expect-error attach code
    err.code = 'invalid_code';
    throw err;
  }

  // TTL для кода (опционально, но полезно)
  if (CODE_TTL_MS > 0 && Date.now() - entry.createdAt > CODE_TTL_MS) {
    codeToClaims.delete(code);
    const err = new Error('code_expired');
    // @ts-expect-error attach code
    err.code = 'code_expired';
    throw err;
  }

  // одноразовый code
  codeToClaims.delete(code);

  const access = crypto.randomBytes(24).toString('hex');
  accessToClaims.set(access, { ...entry, createdAt: Date.now() });

  const idToken = `mock.${entry.provider}.${entry.claims.sub}`;

  return {
    access_token: access,
    id_token: idToken,
    token_type: 'Bearer',
    expires_in: EXPIRES_IN_SEC,
  };
}

export function getUserInfo(accessToken: string) {
  const entry = accessToClaims.get(accessToken);

  if (!entry) {
    const err = new Error('invalid_token');
    // @ts-expect-error attach code
    err.code = 'invalid_token';
    throw err;
  }

  // TTL на access_token
  if (ACCESS_TTL_MS > 0 && Date.now() - entry.createdAt > ACCESS_TTL_MS) {
    accessToClaims.delete(accessToken);
    const err = new Error('token_expired');
    // @ts-expect-error attach code
    err.code = 'token_expired';
    throw err;
  }

  // КРИТИЧНО: одноразовый access_token (consume)
  accessToClaims.delete(accessToken);

  return { provider: entry.provider, claims: entry.claims };
}
