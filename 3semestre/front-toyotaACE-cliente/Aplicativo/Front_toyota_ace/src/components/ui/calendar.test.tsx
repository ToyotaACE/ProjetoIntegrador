import { render, screen } from "@testing-library/react";
import { enUS } from "date-fns/locale";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Calendar } from "@/components/ui/calendar";

describe("Calendar", () => {
  beforeEach(() => localStorage.clear());

  it("renders using the current language when no locale is passed", () => {
    render(
      <LanguageProvider>
        <Calendar mode="single" month={new Date(2026, 0, 1)} />
      </LanguageProvider>,
    );

    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("respects an explicitly provided locale", () => {
    render(
      <LanguageProvider>
        <Calendar mode="single" month={new Date(2026, 0, 1)} locale={enUS} />
      </LanguageProvider>,
    );

    expect(screen.getByText("January 2026")).toBeInTheDocument();
  });
});
