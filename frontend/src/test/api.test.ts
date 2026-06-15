import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../api";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("request", () => {
  it("returns JSON on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ id: 1, name: "Test" })),
    });
    const data = await api.getEvent(1);
    expect(data).toEqual({ id: 1, name: "Test" });
  });

  it("throws on non-JSON response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve("not json"),
    });
    await expect(api.getEvent(1)).rejects.toThrow(
      "Server returned 200 — expected JSON"
    );
  });

  it("throws with detail from error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () =>
        Promise.resolve(JSON.stringify({ detail: "Name already exists" })),
    });
    await expect(api.createEvent({
      name: "Test",
      description: "Desc",
      date: "2026-01-01",
      max_capacity: 10,
    })).rejects.toThrow("Name already exists");
  });

  it("throws with validation errors array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            detail: [
              { loc: ["body", "name"], msg: "field required" },
            ],
          })
        ),
    });
    await expect(api.createEvent({
      name: "",
      description: "",
      date: "",
      max_capacity: 0,
    })).rejects.toThrow("body.name: field required");
  });

  it("throws fallback message when no detail", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(JSON.stringify({})),
    });
    await expect(api.getEvent(1)).rejects.toThrow("Request failed");
  });
});

describe("stripHtml in createEvent", () => {
  it("strips HTML tags from name and description", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: () => Promise.resolve(JSON.stringify({ id: 1 })),
    });
    await api.createEvent({
      name: "<b>Test</b>",
      description: "<script>alert('xss')</script>Desc",
      date: "2026-01-01",
      max_capacity: 10,
    });
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.name).toBe("Test");
    expect(callBody.description).toBe("alert('xss')Desc");
  });
});
