import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;

    bankIdState?: string;
    bankIdNonce?: string;
    bankIdReturnTo?: string;

    bankIdIntent?: 'signin' | 'signup';
  }
}
