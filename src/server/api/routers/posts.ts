import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import type { User } from "@clerk/nextjs/dist/types/server"; // Import User type
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
import type { Post } from "@prisma/client";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};

const addPostWithUserData = async (posts: Post[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);
    if (!author?.username) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author not found",
      });
    }

    return {
      post,
      author: {
        ...author,
        author: author?.username,
      },
    };
  });
};

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1m"),
});

export const postRouter = createTRPCRouter({
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }
      return (await addPostWithUserData([post]))[0];
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return addPostWithUserData(posts);
  }),
  getPostByUserId: publicProcedure
    .input(
      z.object({
        UserId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) =>
      ctx.prisma.post
        .findMany({
          where: {
            authorId: input.UserId,
          },
          take: 100,
          orderBy: { createdAt: "desc" },
        })
        .then(addPostWithUserData),
    ),

  create: privateProcedure
    .input(
      z.object({
        content: z.string().min(1).max(280),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.user;

      const { success } = await ratelimit.limit(authorId);

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
        });
      }

      await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });

      return filterUserForClient(await clerkClient.users.getUser(authorId));
    }),
});
