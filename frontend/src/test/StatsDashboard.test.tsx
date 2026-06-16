import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import StatsDashboard from "../components/StatsDashboard";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function renderWithRouter() {
  return render(
    <BrowserRouter>
      <StatsDashboard />
    </BrowserRouter>
  );
}

const mockEvents = [
  {
    id: 1,
    name: "Party",
    description: "Fun",
    date: "2026-07-04",
    max_capacity: 100,
    attendee_count: 30,
  },
  {
    id: 2,
    name: "Concert",
    description: "Live",
    date: "2026-08-15",
    max_capacity: 50,
    attendee_count: 50,
  },
];

const mockSummary1 = {
  summary: "Popular event",
  cached: false,
};

const mockSummary2 = {
  summary: "Sold out",
  cached: true,
};

beforeEach(() => {
  mockFetch.mockReset();
});

it("shows event stats from list data", async () => {
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockEvents)),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockSummary1)),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockSummary2)),
    });

  renderWithRouter();

  expect(await screen.findByText("Party")).toBeInTheDocument();
  expect(screen.getByText("Concert")).toBeInTheDocument();
  expect(screen.getByText("30 / 100 registrations")).toBeInTheDocument();
  expect(screen.getByText("50 / 50 registrations")).toBeInTheDocument();
  expect(screen.getByText(/Popular event/)).toBeInTheDocument();
  expect(screen.getByText(/Sold out/)).toBeInTheDocument();
});

it("shows empty state", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify([])),
  });

  renderWithRouter();

  expect(await screen.findByText("No events yet")).toBeInTheDocument();
});

it("shows error on fetch failure", async () => {
  mockFetch.mockRejectedValueOnce(new Error("Server error"));

  renderWithRouter();

  expect(await screen.findByText("Server error")).toBeInTheDocument();
});
