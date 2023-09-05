import { SignInButton, useUser } from "@clerk/nextjs";

import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { api } from "@/utils/api";
import { LoadingIcon } from "@/components/Loading";
import { useState } from "react";
import toast from "react-hot-toast";

import { PageLayout } from "@/components/Layout";
import { PostView } from "@/components/PostView";

const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState<string>("");
  const ctx = api.useContext();

  const { mutate } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) {
        toast.error(errorMessage[0]);
      }

      toast.error("too many posts");
    },
  });

  dayjs.extend(relativeTime);

  if (!user) return null;

  return (
    <div className="flex gap-3">
      <Image
        className="rounded-full"
        src={user.profileImageUrl}
        alt="profile image"
        width={100}
        height={100}
      />
      <input
        className=" w-full bg-transparent outline-none "
        type="text"
        placeholder="What's on your mind?"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={() => mutate({ content: input })}>Post</button>
    </div>
  );
};

export default function Home() {
  const { user } = useUser();
  console.log(user);
  const { data, isLoading } = api.posts.getAll.useQuery();
  if (isLoading)
    return (
      <div className="flex h-full min-h-screen w-full flex-col  items-center justify-center">
        <LoadingIcon />
      </div>
    );
  if (user && !data) return <div>Something went wrong</div>;

  return (
    <>
      <PageLayout>
        <div>
          {!user && (
            <div className="flex justify-center">
              <SignInButton />
            </div>
          )}
          {user && <CreatePostWizard />}
        </div>

        <div className="flex flex-col">
          {data?.map((fullPost) => (
            <PostView {...fullPost} key={fullPost.post.id} />
          ))}
        </div>
      </PageLayout>
    </>
  );
}
