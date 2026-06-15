import { Platform } from "react-native";

const DEFAULT_HOST = Platform.select({
  android: "10.0.2.2",
  default: "localhost",
});

const API_BASE = process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:8000`;

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

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
      `Cannot reach API at ${url}`
    );
  }
  const body = await res.json();
  if (!res.ok) {
    const detail = body.detail;
    const message = Array.isArray(detail)
      ? detail.map((e: { loc?: string[]; msg: string }) => `${e.loc?.join(".") ?? ""}: ${e.msg}`).join("; ")
      : detail || "Request failed";
    throw new Error(message);
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
      body: JSON.stringify({
        ...data,
        name: stripHtml(data.name).slice(0, 255),
        description: stripHtml(data.description).slice(0, 1000),
      }),
    }),

  register: (
    eventId: number,
    data: { user_name: string; email: string }
  ) =>
    request<import("./types").Registration>(
      `/events/${eventId}/register`,
      {
        method: "POST",
        body: JSON.stringify({
          user_name: stripHtml(data.user_name).slice(0, 255),
          email: data.email.trim(),
        }),
      }
    ),

  getStats: (id: number) =>
    request<import("./types").EventStats>(`/events/${id}/stats`),

  getAISummary: (id: number) =>
    request<import("./types").AISummary>(`/events/${id}/stats/summary`),

  getAISuggestion: (prompt: string) =>
    request<{ suggestion: string }>(`/ai/suggest?prompt=${encodeURIComponent(prompt)}`, {
      method: "POST",
    }),
};
