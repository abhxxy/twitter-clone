import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs";

export const profileRouter = createTRPCRouter({
  getUserByUsername: publicProcedure
    .input(
      z.object({
        username: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const user = await clerkClient.users.getUserList({
        username: [input.username],
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      return user;
    }),
});
