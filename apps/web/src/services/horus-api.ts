import { defaultWorkspaceData, type WorkspaceData } from "../lib/workspace-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchDashboardToday() {
  const response = await fetch(`${API_URL}/api/dashboard/today`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return response.json();
}

export async function fetchWorkspaceData(): Promise<WorkspaceData> {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/workspace`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return defaultWorkspaceData;
    }

    return (await response.json()) as WorkspaceData;
  } catch {
    return defaultWorkspaceData;
  }
}
