import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { RoomsView } from "@/components/rooms-view";

export default async function RoomsPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  return <RoomsView user={session.user} />;
}
