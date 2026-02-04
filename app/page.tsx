import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function Home() {
  const cookieStore = await cookies()
  const session = cookieStore.get('atlas-session')?.value

  if (session === process.env.AUTH_SECRET) {
    redirect("/dashboard")
  }

  redirect("/login")
}
