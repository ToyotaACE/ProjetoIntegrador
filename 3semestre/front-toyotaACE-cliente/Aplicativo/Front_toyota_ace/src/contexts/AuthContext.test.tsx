import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

function AuthTokenProbe() {
  const { login, setUser, accessToken, isAuthenticated } = useAuth();
  return (
    <div>
      <button onClick={() => void login("driver@example.com", "password")}>Sign in</button>
      <button onClick={() => setUser({
        id: 7,
        nome: "Updated Driver",
        email: "driver@example.com",
      })}>Refresh profile</button>
      <output>{accessToken}</output>
      <output>{String(isAuthenticated)}</output>
    </div>
  );
}

describe("AuthContext access token", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("exposes and persists the accessToken returned by login", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: vi.fn().mockResolvedValue({
        id: 7,
        nome: "Driver",
        email: "driver@example.com",
        accessToken: "login-access-token",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <AuthTokenProbe />
      </AuthProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByText("login-access-token")).toBeInTheDocument();
    });
    expect(JSON.parse(localStorage.getItem("toyota-auth") || "{}").accessToken)
      .toBe("login-access-token");
  });

  it("does not treat a legacy tokenless session as authenticated", async () => {
    localStorage.setItem("toyota-auth", JSON.stringify({
      id: 7,
      nome: "Driver",
      email: "driver@example.com",
    }));

    render(
      <AuthProvider>
        <AuthTokenProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("false")).toBeInTheDocument();
    });
  });

  it("keeps setUser stable and preserves the token when refreshing the profile", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: vi.fn().mockResolvedValue({
        id: 7,
        nome: "Driver",
        email: "driver@example.com",
        accessToken: "login-access-token",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    let firstSetUser: ReturnType<typeof useAuth>["setUser"] | undefined;
    function CaptureSetUser() {
      const auth = useAuth();
      firstSetUser ??= auth.setUser;
      return <output data-testid="stable-setter">{String(firstSetUser === auth.setUser)}</output>;
    }

    render(
      <AuthProvider>
        <AuthTokenProbe />
        <CaptureSetUser />
      </AuthProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => {
      expect(screen.getByText("login-access-token")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Refresh profile" }));
    await waitFor(() => {
      expect(screen.getByTestId("stable-setter")).toHaveTextContent("true");
      expect(JSON.parse(localStorage.getItem("toyota-auth") || "{}").accessToken)
        .toBe("login-access-token");
    });
  });
});
