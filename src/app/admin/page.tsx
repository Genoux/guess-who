import { authorizeAdmin } from "@/shared/lib/auth";

export default async function AdminPage() {
  await authorizeAdmin();
  return (
    <main>
      <h1>Admin</h1>
    </main>
  );
}
