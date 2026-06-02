import { beforeEach, describe, expect, mock, test } from "bun:test";

import type { Socket } from "socket.io";

const {
  authenticateSocketSession,
  disconnectInvalidatedSocketSession,
  headersFromSocketRequest,
  revalidateSocketSession,
} = await import("./socket-auth");

const getSession = mock();
const next = mock();

function buildSocket(headers: Socket["request"]["headers"]): Socket {
  return {
    data: {},
    request: { headers },
  } as Socket;
}

beforeEach(() => {
  getSession.mockReset();
  next.mockReset();
});

describe("headersFromSocketRequest", () => {
  test("copies string and array headers into web Headers for Better Auth", () => {
    const headers = headersFromSocketRequest({
      cookie: "better-auth.session_token=abc",
      "x-forwarded-host": ["localhost:3000", "localhost:8443"],
    });

    expect(headers.get("cookie")).toBe("better-auth.session_token=abc");
    expect(headers.get("x-forwarded-host")).toBe("localhost:3000, localhost:8443");
  });
});

describe("authenticateSocketSession", () => {
  test("stores the Better Auth session user on socket data", async () => {
    const socket = buildSocket({ cookie: "better-auth.session_token=abc" });

    getSession.mockResolvedValueOnce({
      user: {
        id: "user-1",
        username: "ada",
      },
    });

    await authenticateSocketSession(socket, next, getSession);

    const authCall = getSession.mock.calls[0]?.[0] as {
      headers: Headers;
      query: { disableCookieCache: true };
    };
    expect(authCall.headers.get("cookie")).toBe("better-auth.session_token=abc");
    expect(authCall.query).toEqual({ disableCookieCache: true });
    expect(socket.data.user).toMatchObject({
      id: "user-1",
      username: "ada",
    });
    expect(next.mock.calls).toEqual([[]]);
  });

  test("rejects sockets without an authenticated session", async () => {
    const socket = buildSocket({});

    getSession.mockResolvedValueOnce(null);

    await authenticateSocketSession(socket, next, getSession);

    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("unauthorized");
    expect(socket.data.user).toBeUndefined();
  });

  test("rejects sockets when session lookup throws", async () => {
    const socket = buildSocket({ cookie: "better-auth.session_token=abc" });

    getSession.mockRejectedValueOnce(new Error("database unavailable"));

    await authenticateSocketSession(socket, next, getSession);

    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("unauthorized");
    expect(socket.data.user).toBeUndefined();
  });
});

describe("revalidateSocketSession", () => {
  test("keeps socket user data synchronized while the session remains active", async () => {
    const socket = buildSocket({ cookie: "better-auth.session_token=abc" });

    getSession.mockResolvedValueOnce({
      user: {
        id: "user-1",
        username: "ada",
      },
    });

    expect(await revalidateSocketSession(socket, getSession)).toBe(true);
    expect(socket.data.user).toMatchObject({
      id: "user-1",
      username: "ada",
    });
  });

  test("rejects a socket after its session has been superseded", async () => {
    const socket = buildSocket({ cookie: "better-auth.session_token=old" });

    getSession.mockResolvedValueOnce(null);

    expect(await revalidateSocketSession(socket, getSession)).toBe(false);
  });
});

describe("disconnectInvalidatedSocketSession", () => {
  test("notifies the client before closing a superseded socket", () => {
    const emit = mock();
    const disconnect = mock();

    disconnectInvalidatedSocketSession({ disconnect, emit } as unknown as Pick<
      Socket,
      "disconnect" | "emit"
    >);

    expect(emit).toHaveBeenCalledWith("session:invalidated");
    expect(disconnect).toHaveBeenCalledWith(true);
    expect(emit.mock.invocationCallOrder[0]).toBeLessThan(disconnect.mock.invocationCallOrder[0]!);
  });
});
