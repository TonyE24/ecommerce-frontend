import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";

export default async function AuthenticatedNavbar() {
  const token = (await cookies()).get("jwt_token")?.value;

  return <Navbar isAuthenticated={Boolean(token)} />;
}
