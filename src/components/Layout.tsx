import type { PropsWithChildren } from "react";

export const PageLayout = (props: PropsWithChildren) => {
  return (
    <main className="flex min-h-screen justify-center">
      <div className="min-h-screen w-full border-x border-slate-400 text-white md:max-w-2xl">
        {props.children}
      </div>
    </main>
  );
};
