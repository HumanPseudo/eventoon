const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json();
  if (!res.ok) {
    const detail = body.detail;
    const message = Array.isArray(detail)
      ? detail.map((e) => `${e.loc?.join(".") ?? ""}: ${e.msg}`).join("; ")
      : detail || "Request failed";
    throw new Error(message);
  }
  return body as T;
}

export const api = {
  listEvents: () =>
    request<import("./types").Event[]>("/events"),

  getEvent: (id: number) =>
    request<import("./types").Event>(`/events/${id}`),

  createEvent: (data: { name: string; description: string; date: string; max_capacity: number }) =>
    request<import("./types").Event>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (eventId: number, data: { user_name: string; email: string }) =>
    request<import("./types").Registration>(`/events/${eventId}/register`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getStats: (id: number) =>
    request<import("./types").EventStats>(`/events/${id}/stats`),

  getAISummary: (id: number) =>
    request<import("./types").AISummary>(`/events/${id}/stats/summary`),

  getAISuggestion: (prompt: string) =>
    request<{ suggestion: string }>(`/ai/suggest?prompt=${encodeURIComponent(prompt)}`, {
      method: "POST",
      body: "{}",
    }),
};
