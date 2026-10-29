// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import App from "./App";
import { healthScore, selectResources, vms } from "./data";
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: () => null,
  Area: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  location.hash = "";
});
describe("InfraControl demo", () => {
  it("computes health from availability and filters/sorts actual inventory", () => {
    expect(healthScore()).toBe(94);
    expect(selectResources(vms, "db", "alle", "name")[0]?.name).toBe(
      "vm-db-01",
    );
    expect(selectResources(vms, "", "gestoppt", "cpu")).toHaveLength(1);
    expect(selectResources(vms, "", "alle", "cpu")[0]?.cpu).toBe(12);
  });
  it("renders dashboard without making backend requests and opens resource details", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(<App />);
    expect(screen.getByText("Infrastructure Overview")).toBeTruthy();
    expect(screen.getAllByText("DEMO MODE").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("vm-web-01"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Details schließen"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("navigates to inventory and filters and sorts rows", async () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Virtuelle Maschinen" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Ressourcen suchen")).toBeTruthy(),
    );
    fireEvent.change(screen.getByLabelText("Ressourcen suchen"), {
      target: { value: "db" },
    });
    expect(screen.getByText("vm-db-01")).toBeTruthy();
    expect(screen.queryByText("vm-web-01")).toBeNull();
    fireEvent.change(screen.getByLabelText("Ressourcen suchen"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Status filtern"), {
      target: { value: "gestoppt" },
    });
    expect(screen.getByText("vm-build-01")).toBeTruthy();
    expect(screen.queryByText("vm-db-01")).toBeNull();
  });
  it("handles backend diagnostics failure honestly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    location.hash = encodeURIComponent("Einstellungen");
    render(<App />);
    fireEvent.click(screen.getByText("Backend prüfen"));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("Kein Backend"),
    );
  });
});
