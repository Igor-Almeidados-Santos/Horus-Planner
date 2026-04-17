import { fetchWorkspaceData } from "../../services/horus-api";
import { WorkspaceShell } from "../../components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const data = await fetchWorkspaceData();
  return <WorkspaceShell view="plans" data={data} />;
}
