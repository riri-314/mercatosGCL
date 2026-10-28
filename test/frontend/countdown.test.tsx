import { act, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import Countdown from "../../src/components/countdown/countdown";

const seconds = (ms: number) => `${Math.ceil(ms / 1000)}s`;

it("ticks the badge without rerendering its card, and stops after expiry", () => {
  vi.useFakeTimers();
  vi.setSystemTime(1_800_000_000_000);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  const stop = Date.now() + 3000;
  const card = vi.fn(() => <Countdown stop={stop} format={seconds} />);
  const Card = card;
  render(<Card />);
  expect(screen.getByText("3s")).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByText("2s")).toBeInTheDocument();
  expect(card).toHaveBeenCalledOnce();
  act(() => vi.advanceTimersByTime(3000));
  expect(screen.getByText("0s")).toBeInTheDocument();
  expect(vi.getTimerCount()).toBe(0);
});

it("pauses offscreen countdowns and catches up when they reappear", () => {
  vi.useFakeTimers();
  vi.setSystemTime(1_800_000_000_000);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  let intersect: IntersectionObserverCallback = () => {};
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersect = callback; }
    observe = vi.fn();
    disconnect = vi.fn();
  });
  try {
    render(<Countdown stop={Date.now() + 10_000} format={seconds} />);
    expect(vi.getTimerCount()).toBe(0);
    act(() => intersect([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("9s")).toBeInTheDocument();
    act(() => intersect([{ isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver));
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(2000));
    act(() => intersect([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver));
    expect(screen.getByText("7s")).toBeInTheDocument();
  } finally { vi.unstubAllGlobals(); }
});
