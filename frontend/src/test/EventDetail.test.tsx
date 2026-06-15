import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EventDetail from "../components/EventDetail";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function renderWithRouter(id = "1") {
  return render(
    <MemoryRouter initialEntries={[`/events/${id}`]}>
      <Routes>
        <Route path="/events/:id" element={<EventDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

const mockEvent = {
  id: 1,
  name: "Test Event",
  description: "A great event",
  date: "2026-06-15",
  max_capacity: 50,
  attendee_count: 10,
};

beforeEach(() => {
  mockFetch.mockReset();
});

it("renders event details", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(mockEvent)),
  });

  renderWithRouter();

  expect(await screen.findByText("Test Event")).toBeInTheDocument();
  expect(screen.getByText("A great event")).toBeInTheDocument();
  expect(screen.getByText(/2026-06-15/)).toBeInTheDocument();
  expect(screen.getByText(/10 \/ 50/)).toBeInTheDocument();
});

it("shows error on fetch failure", async () => {
  mockFetch.mockRejectedValueOnce(new Error("Not found"));

  renderWithRouter();

  expect(await screen.findByText("Not found")).toBeInTheDocument();
});

it("registers a user successfully", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(mockEvent)),
  });
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 201,
    text: () =>
      Promise.resolve(
        JSON.stringify({
          id: 1,
          event_id: 1,
          user_name: "Alice",
          email: "alice@test.com",
          registration_date: "2026-06-15",
        })
      ),
  });

  renderWithRouter();

  await screen.findByText("Test Event");

  const user = userEvent.setup();
  await user.type(screen.getByRole("textbox", { name: /name/i }), "Alice");
  await user.type(screen.getByRole("textbox", { name: /email/i }), "alice@test.com");
  await user.click(screen.getByRole("button", { name: /register/i }));

  expect(
    await screen.findByText("Successfully registered!")
  ).toBeInTheDocument();
});

it("shows error on registration failure", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(mockEvent)),
  });
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 400,
    text: () =>
      Promise.resolve(JSON.stringify({ detail: "Event is full" })),
  });

  renderWithRouter();

  await screen.findByText("Test Event");

  const user = userEvent.setup();
  await user.type(screen.getByRole("textbox", { name: /name/i }), "Bob");
  await user.type(screen.getByRole("textbox", { name: /email/i }), "bob@test.com");
  await user.click(screen.getByRole("button", { name: /register/i }));

  expect(await screen.findByText("Event is full")).toBeInTheDocument();
});

it("displays back button and navigates back", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(mockEvent)),
  });

  renderWithRouter();

  expect(await screen.findByText(/back/i)).toBeInTheDocument();
});
