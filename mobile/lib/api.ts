import { Platform } from "react-native";
import Constants from "expo-constants";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === "web") {
    return "/api";
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:8000`;
  }
  const defaultHost = Platform.select({ android: "10.0.2.2", default: "localhost" })!;
  return `http://${defaultHost}:8000`;
}

const API_BASE = getApiBase();

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
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    console.error(`[API] Non-JSON response (${res.status}):`, text.slice(0, 500));
    throw new Error(`Server returned ${res.status} — expected JSON`);
  }
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

  getAISuggestion: (data: { name: string; description: string; date: string; max_capacity: number }) =>
    request<{ suggestion: string }>("/ai/suggest", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
