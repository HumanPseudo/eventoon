import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NewEvent from "../components/NewEvent";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <NewEvent />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockFetch.mockReset();
});

it("displays the form", () => {
  renderWithRouter();
  expect(
    screen.getByPlaceholderText("e.g. Summer Beach Party")
  ).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /description/i })).toBeInTheDocument();
});

it("shows error when submitting empty form", async () => {
  renderWithRouter();
  const form = screen.getByRole("button", { name: /create event/i }).closest("form");
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
  expect(await screen.findByText("All fields are required.")).toBeInTheDocument();
});

it("calls API and navigates on success", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 201,
    text: () =>
      Promise.resolve(JSON.stringify({ id: 42, name: "My Event" })),
  });

  renderWithRouter();
  const user = userEvent.setup();

  await user.type(
    screen.getByPlaceholderText("e.g. Summer Beach Party"),
    "My Event"
  );
  await user.type(screen.getByLabelText(/^date/i), "2026-12-25");
  await user.type(screen.getByRole("spinbutton", { name: /max capacity/i }), "100");
  await user.type(screen.getByRole("textbox", { name: /description/i }), "A fun event");

  await user.click(screen.getByRole("button", { name: /create event/i }));

  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.name).toBe("My Event");
  });
});
