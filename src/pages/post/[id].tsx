import Head from "next/head";
import Image from "next/image";
import type { GetStaticProps } from "next";

import { PageLayout } from "@/components/Layout";
import { PostView } from "@/components/PostView";
import { generateSSgHelper } from "@/server/helpers/ssgHelper";

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

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  console.log(id);
  const { data } = api.posts.getById.useQuery({
    id,
  });
  console.log(id);

  if (!data) return <div>404</div>;
  return (
    <>
      a
      <Head>
        <title>{`${data.post.content}-@${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView {...data} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSgHelper();

  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("slug is not a string");

  await ssg.posts.getById.prefetch({ id });

  return {
    props: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      trpcState: JSON.parse(JSON.stringify(ssg.dehydrate())),
      id,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
