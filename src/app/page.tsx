import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "owner") {
    redirect("/owner");
  } else {
    redirect("/driver");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Redirecting...</h1>
    </main>
  );
}
