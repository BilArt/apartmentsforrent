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
  { provider: BankIdProvider; claims: MockClaims }
>();
const accessToClaims = new Map<
  string,
  { provider: BankIdProvider; claims: MockClaims }
>();

export function makeState() {
  return crypto.randomBytes(16).toString('hex');
}

export function makeNonce() {
  return crypto.randomBytes(16).toString('hex');
}

export function issueAuthCode(provider: BankIdProvider, claims: MockClaims) {
  const code = crypto.randomBytes(16).toString('hex');
  codeToClaims.set(code, { provider, claims });
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

  codeToClaims.delete(code);

  const access = crypto.randomBytes(24).toString('hex');
  accessToClaims.set(access, entry);

  const idToken = `mock.${entry.provider}.${entry.claims.sub}`;

  return {
    access_token: access,
    id_token: idToken,
    token_type: 'Bearer',
    expires_in: 600,
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
  return entry;
}
