import { cookies } from "next/headers";
import { WorkspaceUnavailable } from "../../components/workspace-unavailable";
import { ApiError, fetchWorkspaceData } from "../../services/horus-api";
import { WorkspaceShell } from "../../components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function ExecutionPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("horus_access_token")?.value ?? null;
  const demoMode = cookieStore.get("horus_demo_mode")?.value === "1" && !token;

  try {
    const data = await fetchWorkspaceData({
      token,
      allowDemoFallback: demoMode,
    });
    return <WorkspaceShell view="execution" data={data} />;
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Nao foi possivel carregar os dados de execucao agora. Confirme se a API esta online.";
    return <WorkspaceUnavailable message={message} isAuthenticated={Boolean(token)} />;
  }
}
