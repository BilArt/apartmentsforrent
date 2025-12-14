import { API_BASE_URL } from "./config";

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error(`Health failed: ${res.status}`);
  return res.json();
}
