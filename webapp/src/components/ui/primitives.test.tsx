import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

describe("ui primitives", () => {
  it("renders badge variants and asChild mode", () => {
    render(
      <>
        <Badge className="custom-badge">Default</Badge>
        <Badge asChild variant="link">
          <a href="/docs">Docs</a>
        </Badge>
      </>,
    );

    const defaultBadge = screen.getByText("Default");
    const linkBadge = screen.getByRole("link", { name: "Docs" });

    expect(defaultBadge).toHaveAttribute("data-slot", "badge");
    expect(defaultBadge).toHaveAttribute("data-variant", "default");
    expect(defaultBadge).toHaveClass("custom-badge");

    expect(linkBadge).toHaveAttribute("data-slot", "badge");
    expect(linkBadge).toHaveAttribute("data-variant", "link");
    expect(linkBadge).toHaveAttribute("href", "/docs");

    expect(badgeVariants({ variant: "destructive" })).toContain(
      "bg-destructive",
    );
  });

  it("renders input and label with expected accessibility attributes", () => {
    render(
      <>
        <Label htmlFor="email-field">Email</Label>
        <Input id="email-field" type="email" className="custom-input" />
      </>,
    );

    const label = screen.getByText("Email");
    const input = screen.getByLabelText("Email");

    expect(label).toHaveAttribute("data-slot", "label");
    expect(label.tagName).toBe("LABEL");

    expect(input).toHaveAttribute("data-slot", "input");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveClass("custom-input");
  });

  it("renders separator with vertical orientation", () => {
    render(<Separator data-testid="separator" orientation="vertical" />);

    const separator = screen.getByTestId("separator");

    expect(separator).toHaveAttribute("data-slot", "separator");
    expect(separator).toHaveAttribute("data-orientation", "vertical");
  });

  it("renders skeleton and spinner", () => {
    render(
      <>
        <Skeleton data-testid="skeleton" className="h-4" />
        <Spinner className="size-8" />
      </>,
    );

    expect(screen.getByTestId("skeleton")).toHaveAttribute(
      "data-slot",
      "skeleton",
    );
    expect(screen.getByTestId("skeleton")).toHaveClass("h-4");

    const spinner = screen.getByRole("status", { name: "Loading" });
    expect(spinner).toHaveClass("size-8");
  });

  it("renders progress indicator using the provided value", () => {
    render(<Progress data-testid="progress" value={25} />);

    const progress = screen.getByTestId("progress");
    const indicator = progress.querySelector("[data-slot='progress-indicator']");

    expect(progress).toHaveAttribute("data-slot", "progress");
    expect(indicator).not.toBeNull();
    expect(indicator).toHaveStyle("transform: translateX(-75%)");
  });

  it("renders avatar and card slot structure", () => {
    render(
      <>
        <Avatar data-testid="avatar">
          <AvatarImage alt="User avatar" src="/avatar.png" />
          <AvatarFallback>OA</AvatarFallback>
        </Avatar>
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
            <CardAction>
              <button type="button">Action</button>
            </CardAction>
          </CardHeader>
          <CardContent>Body</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      </>,
    );

    const avatar = screen.getByTestId("avatar");
    const card = screen.getByTestId("card");

    expect(avatar).toHaveAttribute("data-slot", "avatar");
    expect(avatar.querySelector("[data-slot='avatar-fallback']")).not.toBeNull();
    expect(screen.getByText("OA")).toHaveAttribute("data-slot", "avatar-fallback");

    expect(card).toHaveAttribute("data-slot", "card");
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByText("Description")).toHaveAttribute(
      "data-slot",
      "card-description",
    );
    expect(screen.getByText("Body")).toHaveAttribute("data-slot", "card-content");
    expect(screen.getByText("Footer")).toHaveAttribute(
      "data-slot",
      "card-footer",
    );
  });
});
