import type { Socket } from "socket.io";

import { auth } from "@/lib/auth";

import { sessionInvalidatedEvent } from "../../shared/realtime-events";

type SocketMiddlewareNext = (error?: Error) => void;
type SocketSessionLookup = (context: {
  headers: Headers;
  query: {
    disableCookieCache: true;
  };
}) => ReturnType<typeof auth.api.getSession>;

export function headersFromSocketRequest(headers: Socket["request"]["headers"]) {
  const webHeaders = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      webHeaders.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => webHeaders.append(key, item));
    }
  }

  return webHeaders;
}

export async function authenticateSocketSession(
  socket: Socket,
  next: SocketMiddlewareNext,
  getSession: SocketSessionLookup = auth.api.getSession,
) {
  const sessionData = await getSocketSession(socket, getSession);

  if (!sessionData) {
    return next(new Error("unauthorized"));
  }

  socket.data.user = sessionData.user;
  next();
}

export async function revalidateSocketSession(
  socket: Socket,
  getSession: SocketSessionLookup = auth.api.getSession,
) {
  const sessionData = await getSocketSession(socket, getSession);

  if (!sessionData) {
    return false;
  }

  socket.data.user = sessionData.user;
  return true;
}

export function disconnectInvalidatedSocketSession(socket: Pick<Socket, "disconnect" | "emit">) {
  socket.emit(sessionInvalidatedEvent);
  socket.disconnect(true);
}

async function getSocketSession(socket: Socket, getSession: SocketSessionLookup) {
  try {
    return await getSession({
      headers: headersFromSocketRequest(socket.request.headers),
      query: { disableCookieCache: true },
    });
  } catch {
    return null;
  }
}
