import { redirect } from "next/navigation"
import { AuthTest } from "@/components/auth-test"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Overview",
}

export default function HomePage() {
  redirect("/integrations")
}
