import { TRPCError, initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";

import { prisma } from "@/server/db";
import { getAuth } from "@clerk/nextjs/server";

type CreateContextOptions = Record<string, never>;

export const createTRPCContext = (_opts: CreateNextContextOptions) => {
  const { req } = _opts;

  const sesh = getAuth(req);
  const userId = sesh.userId;

  return {
    prisma,
    userId,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

const enforceUserisAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  return next({
    ctx: {
      user: ctx.userId,
    },
  });
});
export const privateProcedure = publicProcedure.use(enforceUserisAuthed);
