import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Layout from "../components/Layout";

function renderWithPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Layout />
    </MemoryRouter>
  );
}

it("renders navigation tabs", () => {
  renderWithPath("/");
  expect(screen.getByText("Eventoon")).toBeInTheDocument();
  expect(screen.getByText("Events")).toBeInTheDocument();
  expect(screen.getByText("New Event")).toBeInTheDocument();
  expect(screen.getByText("Stats")).toBeInTheDocument();
});

it("renders outlet content", () => {
  renderWithPath("/");
  expect(screen.getByText("Eventoon")).toBeInTheDocument();
});

it("highlights the Events tab at /", () => {
  renderWithPath("/");
  const eventsTab = screen.getByRole("tab", { name: /events/i });
  expect(eventsTab).toHaveAttribute("aria-selected", "true");
});
