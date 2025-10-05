import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { CompleteIDE } from "@/components/complete-ide";

export default async function RoomPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();

    if (!session) {
        redirect("/api/auth/guest");
    }

    const { id } = await params;

    return <CompleteIDE roomId={id} userId={session.user.id ?? ""} />;
}
