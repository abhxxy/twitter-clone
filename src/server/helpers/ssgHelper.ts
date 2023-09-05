import superjson from "superjson";
import { appRouter } from "@/server/api/root";
import { prisma } from "@/server/db";
import type { GetStaticProps } from "next";
import { createServerSideHelpers } from "@trpc/react-query/server";

export const generateSSgHelper = () => {
  return createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });
};
