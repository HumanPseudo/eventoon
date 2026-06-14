import { Platform } from "react-native";

const DEFAULT_HOST = Platform.select({
  android: "10.0.2.2",
  default: "localhost",
});

const API_BASE = process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:8000`;

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    console.log(`[API] Requesting: ${url}`);
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (e) {
    console.error(`[API] Connection Error:`, e);
    throw new Error(
      `Cannot reach API at ${url} — ${(e as Error).message}`
    );
  }
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.detail || "Request failed");
  }
  return body as T;
}

export const api = {
  listEvents: () => request<import("./types").Event[]>("/events"),

  getEvent: (id: number) =>
    request<import("./types").Event>(`/events/${id}`),

  createEvent: (data: {
    name: string;
    description: string;
    date: string;
    max_capacity: number;
  }) =>
    request<import("./types").Event>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (
    eventId: number,
    data: { user_name: string; email: string }
  ) =>
    request<import("./types").Registration>(
      `/events/${eventId}/register`,
      { method: "POST", body: JSON.stringify(data) }
    ),

  getStats: (id: number) =>
    request<import("./types").EventStats>(`/events/${id}/stats`),
};
