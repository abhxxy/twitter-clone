import Head from "next/head";
import Image from "next/image";

import type { NextPage } from "next";
import { api } from "@/utils/api";

const ProfileFeed = (props: { userId: string }) => {
  const { data } = api.posts.getPostByUserId.useQuery({ UserId: props.userId });

  if (!data?.length) return <div>user has not posted</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const PageView: NextPage<{ username: string }> = ({ username }) => {
  console.log(username);
  const { data } = api.profile.getUserByUsername.useQuery({
    username,
  });
  console.log(username);

  if (!data) return <div>404</div>;
  return (
    <>
      a
      <Head>
        <title>{username}</title>
      </Head>
      <PageLayout>
        <div className="  relative h-48 border-b border-slate-400 bg-slate-200">
          <Image
            className="absolute bottom-0 left-0  -mb-[64px] ml-4  rounded-full"
            src={data.profileImageUrl}
            alt={`${username}`}
            width={128}
            height={128}
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="p-5  text-2xl font-bold">@{username}</div>
        <div className="border-b border-slate-400" />
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};
import superjson from "superjson";
import { appRouter } from "@/server/api/root";
import { prisma } from "@/server/db";
import type { GetStaticProps } from "next";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { PageLayout } from "@/components/Layout";
import { PostView } from "@/components/PostView";

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("slug is not a string");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      trpcState: JSON.parse(JSON.stringify(ssg.dehydrate())),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default PageView;
