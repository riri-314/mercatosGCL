import { render, screen, within } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { expect, it } from "vitest";
import EncheresList from "../../src/sections/comitards/comitard-encheres";

it("adds precision to both neighboring bids, including across a minute boundary", () => {
  const start = new Date(2026, 9, 28, 12, 34, 59, 850).getTime();
  const encheres = [1500, 500, 0, -600_000].map((offset, index) => ({
    date: Timestamp.fromMillis(start + offset),
    sender: "buyer",
    vote: 10 - index,
  }));
  render(<EncheresList encheres={encheres} cerclesData={{ buyer: { name: "Cercle Beta" } }} won={false} />);
  const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
  const times = rows.map((row) => row.querySelector("time")!);

  expect(times[0]).toHaveTextContent(/12:35:01$/);
  expect(times[1]).toHaveTextContent(/12:35:00,350$/);
  expect(times[2]).toHaveTextContent(/12:34:59,850$/);
  expect(times[3]).toHaveTextContent(/12:24$/);
  expect(times[3]).toHaveAttribute("title", expect.stringContaining("12:24:59,850"));
  expect(times[1]).toHaveAttribute("datetime", new Date(start + 500).toISOString());
});

it("keeps a single bid compact while making its exact timestamp available", () => {
  render(<EncheresList
    encheres={[{ sender: "buyer", vote: 1, date: Timestamp.fromDate(new Date(2026, 9, 28, 9, 15, 23, 456)) }]}
    cerclesData={{ buyer: { name: "Cercle Beta" } }}
    won
  />);
  const time = screen.getByRole("table").querySelector("time")!;
  expect(time).toHaveTextContent(/09:15$/);
  expect(time).toHaveAttribute("title", expect.stringContaining("09:15:23,456"));
});
