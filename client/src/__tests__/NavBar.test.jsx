import React from "react";
import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";

test("renders navigation links", () => {
  render(
    <BrowserRouter>
      <NavBar />
    </BrowserRouter>,
  );

  expect(screen.getByText(/hjem/i)).toBeInTheDocument();
});
