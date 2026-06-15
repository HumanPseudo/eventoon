const BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? "http://localhost:8000" : "/api"
);

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
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
  listEvents: () =>
    request<import("./types").Event[]>("/events"),

  getEvent: (id: number) =>
    request<import("./types").Event>(`/events/${id}`),

  createEvent: (data: { name: string; description: string; date: string; max_capacity: number }) =>
    request<import("./types").Event>("/events", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        name: stripHtml(data.name).slice(0, 255),
        description: stripHtml(data.description).slice(0, 1000),
      }),
    }),

  register: (eventId: number, data: { user_name: string; email: string }) =>
    request<import("./types").Registration>(`/events/${eventId}/register`, {
      method: "POST",
      body: JSON.stringify({
        user_name: stripHtml(data.user_name).slice(0, 255),
        email: data.email.trim(),
      }),
    }),

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
