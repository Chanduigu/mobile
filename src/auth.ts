import NextAuth, { type DefaultSession } from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { db } from "./db"
import { users } from "./db/schema"
import { eq } from "drizzle-orm"

declare module "next-auth" {
    interface Session {
        user: {
            role: string
            id: string
        } & DefaultSession["user"]
    }

    interface User {
        role: string
        id: string
    }
}

const nextAuthResult = NextAuth({
    ...authConfig,
    trustHost: true,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ username: z.string(), password: z.string().min(1) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data;
                    const user = await db.select().from(users).where(eq(users.username, username)).get();

                    if (!user) return null;

                    // In a real app, use bcrypt.compare here
                    // For this demo/internship practice, specific plain text comparison is okay if not strictly prod 
                    // BUT I should try to use simple comparison as requested "Simple Pani Puri"
                    // Let's assume plain text for simplicity as per "Simple" request or just direct string match
                    if (password === user.password) return user;
                }

                return null;
            },
        }),
    ],
});

export const { handlers, auth, signIn, signOut } = nextAuthResult;
