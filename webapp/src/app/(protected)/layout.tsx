import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";

import { HydrateClient } from "@/trpc/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  return (
    <HydrateClient>
      <main className="">{children}</main>
    </HydrateClient>
  );
}
