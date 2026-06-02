import { createAuthMiddleware } from "better-auth/api";

type SessionSummary = {
  createdAt: Date | string;
  token: string;
};

type SessionAdapter = {
  deleteSession: (token: string) => Promise<void>;
  listSessions: (
    userId: string,
    options?: { onlyActiveSessions?: boolean },
  ) => Promise<SessionSummary[]>;
};

function compareSessions(left: SessionSummary, right: SessionSummary) {
  const createdAtDifference =
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  return createdAtDifference || left.token.localeCompare(right.token);
}

export function getSupersededSessionTokens(
  sessions: SessionSummary[],
  currentSession: SessionSummary,
) {
  return sessions
    .filter(
      (session) =>
        session.token !== currentSession.token && compareSessions(session, currentSession) < 0,
    )
    .map((session) => session.token);
}

export async function revokeSupersededSessions(
  adapter: SessionAdapter,
  userId: string,
  currentSession: SessionSummary,
) {
  const sessions = await adapter.listSessions(userId, { onlyActiveSessions: true });
  const tokens = getSupersededSessionTokens(sessions, currentSession);

  await Promise.all(tokens.map((token) => adapter.deleteSession(token)));
}

export function singleActiveSession() {
  return {
    id: "single-active-session",
    hooks: {
      after: [
        {
          matcher: () => true,
          handler: createAuthMiddleware(async (ctx) => {
            const newSession = ctx.context.newSession;

            if (!newSession) {
              return;
            }

            await revokeSupersededSessions(
              ctx.context.internalAdapter,
              newSession.user.id,
              newSession.session,
            );
          }),
        },
      ],
    },
  };
}
