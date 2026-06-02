import { describe, expect, mock, test } from "bun:test";

import { getSupersededSessionTokens, revokeSupersededSessions } from "./single-active-session";

const currentSession = {
  createdAt: new Date("2026-06-02T04:00:02.000Z"),
  token: "session-current",
};

describe("single active session", () => {
  test("keeps the newest session and identifies older active sessions for revocation", () => {
    expect(
      getSupersededSessionTokens(
        [
          { createdAt: new Date("2026-06-02T04:00:01.000Z"), token: "session-old" },
          currentSession,
          { createdAt: new Date("2026-06-02T04:00:03.000Z"), token: "session-future" },
        ],
        currentSession,
      ),
    ).toEqual(["session-old"]);
  });

  test("uses the token as a stable tie-breaker for sessions created in the same millisecond", () => {
    const createdAt = new Date("2026-06-02T04:00:02.000Z");

    expect(
      getSupersededSessionTokens(
        [
          { createdAt, token: "session-a" },
          { createdAt, token: "session-b" },
        ],
        { createdAt, token: "session-b" },
      ),
    ).toEqual(["session-a"]);
  });

  test("accepts serialized Redis session timestamps", () => {
    expect(
      getSupersededSessionTokens(
        [
          { createdAt: "2026-06-02T04:00:01.000Z", token: "session-old" },
          { createdAt: "2026-06-02T04:00:02.000Z", token: "session-current" },
        ],
        currentSession,
      ),
    ).toEqual(["session-old"]);
  });

  test("revokes superseded sessions through the Better Auth adapter", async () => {
    const deleteSession = mock(async (_token: string) => undefined);
    const listSessions = mock(async () => [
      { createdAt: new Date("2026-06-02T04:00:00.000Z"), token: "session-a" },
      { createdAt: new Date("2026-06-02T04:00:01.000Z"), token: "session-b" },
      currentSession,
    ]);

    await revokeSupersededSessions({ deleteSession, listSessions }, "user-1", currentSession);

    expect(listSessions).toHaveBeenCalledWith("user-1", { onlyActiveSessions: true });
    expect(deleteSession.mock.calls.map(([token]) => token)).toEqual(["session-a", "session-b"]);
  });
});
