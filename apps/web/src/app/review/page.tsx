import { fetchWorkspaceData } from "../../services/horus-api";
import { WorkspaceShell } from "../../components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const data = await fetchWorkspaceData();
  return <WorkspaceShell view="review" data={data} />;
}
