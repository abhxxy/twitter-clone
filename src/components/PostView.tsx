import Image from "next/image";
import dayjs from "dayjs";

import Link from "next/link";
import type { RouterOutputs } from "@/utils/api";

import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type postWithUser = RouterOutputs["posts"]["getAll"][number];

export const PostView = (props: postWithUser) => {
  const { post, author } = props;
  console.log(post);
  return (
    <div className="flex  gap-4 border-b border-slate-500 p-4" key={post.id}>
      <Image
        className="rounded-full"
        alt="profile image"
        src={author.profileImageUrl}
        width={50}
        height={50}
      />
      <div className="flex flex-col">
        <div className="flex gap-4">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/@${author.username}`}>
            <span>{`${dayjs(post.createdAt).fromNow()}`}</span>
          </Link>
        </div>
        <span>{post.content}</span>
      </div>
    </div>
  );
};
