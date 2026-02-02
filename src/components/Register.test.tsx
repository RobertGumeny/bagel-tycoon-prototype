/**
 * Register Component Tests
 * Task: BT-012
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Register } from "./Register";

describe("Register Component", () => {
  const defaultProps = {
    hasRegisterManager: false,
    canTakeOrder: true,
    money: 1000,
    onTakeOrder: vi.fn(),
    onAutomateRegister: vi.fn(),
    hasSecondRegister: false,
    onAddSecondRegister: vi.fn(),
  };

  it("renders the register component", () => {
    render(<Register {...defaultProps} />);
    expect(screen.getByText("Cash Register")).toBeInTheDocument();
  });

  describe("Unautomated State", () => {
    it("shows Take Order button", () => {
      render(<Register {...defaultProps} />);
      expect(screen.getByText("Take Order")).toBeInTheDocument();
    });

    it("shows Hire Register Manager button", () => {
      render(<Register {...defaultProps} />);
      expect(screen.getByText(/Hire Register Manager/i)).toBeInTheDocument();
    });

    it("does not show Automated badge", () => {
      render(<Register {...defaultProps} />);
      expect(screen.queryByText("Automated")).not.toBeInTheDocument();
    });

    it("applies dashed border styling", () => {
      const { container } = render(<Register {...defaultProps} />);
      const registerElement = container.firstChild as HTMLElement;
      expect(registerElement).toHaveClass("border-dashed");
    });

    it("shows description text when not automated", () => {
      render(<Register {...defaultProps} />);
      expect(
        screen.getByText(/Hire a manager to automatically take orders/i),
      ).toBeInTheDocument();
    });
  });

  describe("Automated State", () => {
    const automatedProps = {
      ...defaultProps,
      hasRegisterManager: true,
    };

    it("shows Automated badge", () => {
      render(<Register {...automatedProps} />);
      expect(screen.getByText("Automated")).toBeInTheDocument();
    });

    it("does not show Hire Register Manager button", () => {
      render(<Register {...automatedProps} />);
      expect(
        screen.queryByText(/Hire Register Manager/i),
      ).not.toBeInTheDocument();
    });

    it("applies solid card styling", () => {
      const { container } = render(<Register {...automatedProps} />);
      const registerElement = container.firstChild as HTMLElement;
      expect(registerElement).toHaveClass("card");
      expect(registerElement).not.toHaveClass("border-dashed");
    });

    it("does not show description text when automated", () => {
      render(<Register {...automatedProps} />);
      expect(
        screen.queryByText(/Hire a manager to automatically take orders/i),
      ).not.toBeInTheDocument();
    });

    it("disables and shrinks Take Order button when automated", () => {
      const { container } = render(<Register {...automatedProps} />);
      const button = screen.getByText("Take Order") as HTMLButtonElement;
      expect(button).toBeDisabled();
      expect(container.firstChild).toBeTruthy();
    });

    it("shows Add Second Register button when automated and not purchased", () => {
      render(<Register {...automatedProps} />);
      expect(screen.getByText(/Add Second Register/i)).toBeInTheDocument();
    });
  });

  describe("Take Order Button", () => {
    it("is enabled when canTakeOrder is true", () => {
      render(<Register {...defaultProps} canTakeOrder={true} />);
      const button = screen.getByText("Take Order");
      expect(button).not.toBeDisabled();
    });

    it("is disabled when canTakeOrder is false", () => {
      render(<Register {...defaultProps} canTakeOrder={false} />);
      const button = screen.getByText("Take Order");
      expect(button).toBeDisabled();
    });

    it("calls onTakeOrder when clicked", async () => {
      const user = userEvent.setup();
      const onTakeOrder = vi.fn();
      render(<Register {...defaultProps} onTakeOrder={onTakeOrder} />);

      const button = screen.getByText("Take Order");
      await user.click(button);

      expect(onTakeOrder).toHaveBeenCalledTimes(1);
    });
  });

  describe("Hire Register Manager Button", () => {
    it("is enabled when player has sufficient funds", () => {
      render(<Register {...defaultProps} money={250} />);
      const button = screen.getByText(/Hire Register Manager/i);
      expect(button).not.toBeDisabled();
    });

    it("is disabled when player has insufficient funds", () => {
      render(<Register {...defaultProps} money={100} />);
      const button = screen.getByText(/Hire Register Manager/i);
      expect(button).toBeDisabled();
    });

    it("calls onAutomateRegister when clicked", async () => {
      const user = userEvent.setup();
      const onAutomateRegister = vi.fn();
      render(
        <Register {...defaultProps} onAutomateRegister={onAutomateRegister} />,
      );

      const button = screen.getByText(/Hire Register Manager/i);
      await user.click(button);

      expect(onAutomateRegister).toHaveBeenCalledTimes(1);
    });
  });
});
