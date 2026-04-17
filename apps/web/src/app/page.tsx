import { fetchWorkspaceData } from "../services/horus-api";
import { WorkspaceShell } from "../components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await fetchWorkspaceData();
  return <WorkspaceShell view="dashboard" data={data} />;
}
