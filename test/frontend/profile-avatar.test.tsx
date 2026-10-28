import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import ProfileAvatar from "../../src/components/profile-avatar/profile-avatar";

it("loads a thumbnail lazily and falls back to the full picture on failure", () => {
  render(<ProfileAvatar alt="Alice" picture="/full.jpg" thumbnail="/thumbnail.webp" />);
  const image = screen.getByAltText("Alice");
  expect(image).toHaveAttribute("src", "/thumbnail.webp");
  expect(image).toHaveAttribute("loading", "lazy");
  expect(image).toHaveAttribute("decoding", "async");
  fireEvent.error(image);
  expect(image).toHaveAttribute("src", "/full.jpg");
  fireEvent.error(image);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

it("supports existing profiles with no thumbnail", () => {
  render(<ProfileAvatar alt="Alice" picture="/legacy.jpg" />);
  expect(screen.getByAltText("Alice")).toHaveAttribute("src", "/legacy.jpg");
});
