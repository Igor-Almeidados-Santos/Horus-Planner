import { cookies } from "next/headers";
import { fetchWorkspaceData } from "../../services/horus-api";
import { WorkspaceShell } from "../../components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function ExecutionPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("horus_access_token")?.value ?? null;
  const data = await fetchWorkspaceData(token);
  return <WorkspaceShell view="execution" data={data} />;
}
