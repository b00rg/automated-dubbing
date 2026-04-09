import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import ProtectedPageClient from "./_components/protected-page-client";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/signin");

  return <ProtectedPageClient session={session} />;
}
