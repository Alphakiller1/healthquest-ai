import { redirect } from "next/navigation";

/** The dashboard became Today. Kept so existing redirects and bookmarks still land. */
export default function DashboardPage() {
  redirect("/today");
}
