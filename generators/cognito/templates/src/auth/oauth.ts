import { jwtDecode } from "jwt-decode";
import {
  cognitoTokenUrl,
  cognitoTokenCallBody,
  cognitoRefreshCallBody,
} from "../utility/globals";
import { Cookie } from "elysia";

interface AuthObject {
  id_token: string;
  refresh_token: string;
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

export interface Tokens {
  refresh_token: string;
  access_token: string;
}

type RefreshObject = Omit<AuthObject, "refresh_token">;

export async function getTokens(code: string): Promise<AuthObject> {
  const url = cognitoTokenUrl;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: cognitoTokenCallBody(code),
  });
  const auth = (await response.json()) as AuthObject;
  console.log(`Cognito tokens endpoint response: ${JSON.stringify(auth)}`);
  return auth;
}

export async function refreshTokens(refresh: string): Promise<RefreshObject> {
  const url = cognitoTokenUrl;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: cognitoRefreshCallBody(refresh),
  });
  console.log("Refreshing tokens...");
  const auth = await response.json();
  return auth as RefreshObject;
}

export async function checkAndRefreshTokens(tokens: Tokens): Promise<Tokens> {
  const currentTokens = tokens;
  const decoded = jwtDecode(currentTokens.access_token);
  if (decoded.exp && decoded.exp - Date.now() < 300000) {
    const newTokens = await refreshTokens(currentTokens.refresh_token);
    currentTokens.access_token = newTokens.access_token;
  }
  return currentTokens;
}

export function setAuthCookies(
  access_cookie: Cookie<string | undefined>,
  refresh_cookie: Cookie<string | undefined>,
  tokens: Tokens,
  path: string
) {
  setCookie(access_cookie, tokens.access_token, path, 3600);
  setCookie(refresh_cookie, tokens.refresh_token, path, 3600 * 24 * 30);
}

export function unsetCookies(
  cookies: Cookie<string | undefined>[],
  path: string
) {
  cookies.forEach((cookie) => {
    cookie.path = path;
    cookie.remove();
  });
}

export function setCookie(
  cookie: Cookie<string | undefined>,
  value: string,
  path: string,
  maxAge: number
) {
  cookie.value = value;
  cookie.maxAge = maxAge;
  cookie.path = path;
  cookie.httpOnly = true;
  if (
    process.env.NODE_ENV == "local" ||
    process.env.NODE_ENV == "local-docker"
  ) {
    cookie.secure = false;
    cookie.secure = false;
  } else {
    cookie.secure = true;
    cookie.secure = true;
  }
  cookie.sameSite = "strict";
}
