import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import EventList from "../components/EventList";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function renderWithRouter() {
  return render(
    <BrowserRouter>
      <EventList />
    </BrowserRouter>
  );
}

const mockEvents = [
  {
    id: 1,
    name: "Party",
    description: "Fun party",
    date: "2026-07-04",
    max_capacity: 100,
    attendee_count: 30,
  },
  {
    id: 2,
    name: "Concert",
    description: "Live music",
    date: "2026-08-15",
    max_capacity: 50,
    attendee_count: 50,
  },
];

beforeEach(() => {
  mockFetch.mockReset();
});

it("shows loading then event cards", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(mockEvents)),
  });

  renderWithRouter();

  expect(await screen.findByText("Party")).toBeInTheDocument();
  expect(screen.getByText("Concert")).toBeInTheDocument();
});

it("shows Open chip for non-full events", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(mockEvents)),
  });

  renderWithRouter();

  expect(await screen.findByText("Open")).toBeInTheDocument();
});

it("shows Full chip for full events", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(mockEvents)),
  });

  renderWithRouter();

  expect(await screen.findByText("Full")).toBeInTheDocument();
});

it("renders View Details links", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(mockEvents)),
  });

  renderWithRouter();

  const links = await screen.findAllByText("View Details");
  expect(links).toHaveLength(2);
});

it("shows error on fetch failure", async () => {
  mockFetch.mockRejectedValueOnce(new Error("Network error"));

  renderWithRouter();

  expect(await screen.findByText("Network error")).toBeInTheDocument();
});
