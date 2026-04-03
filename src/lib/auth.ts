import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          isHolder: user.isHolder,
          isClaimer: user.isClaimer,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isHolder = (user as unknown as { isHolder: boolean }).isHolder;
        token.isClaimer = (user as unknown as { isClaimer: boolean }).isClaimer;
      } else if (token.id) {
        // Refresh from DB on subsequent requests so role upgrades
        // take effect without re-login
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isHolder: true, isClaimer: true },
        });
        if (dbUser) {
          token.isHolder = dbUser.isHolder;
          token.isClaimer = dbUser.isClaimer;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isHolder = token.isHolder as boolean;
        session.user.isClaimer = token.isClaimer as boolean;
      }
      return session;
    },
  },
};
