import { DefaultSession } from 'next-auth';
import { UserRole } from '@prisma/client';

/**
 * Extended session type with user id and role
 * Export this for use in code that needs explicit typing
 */
export interface ExtendedSession extends DefaultSession {
  user: {
    id: string;
    role: UserRole;
  } & DefaultSession['user'];
  accessToken?: string;
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
    accessToken?: string;
  }

  interface User {
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    accessToken?: string;
  }
}
