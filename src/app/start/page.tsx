import { redirect } from "next/navigation";

/** Older links pointed here; sign-in is the first step now. */
export default function StartPage() {
  redirect("/login");
}
