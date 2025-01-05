import { jwtDecode } from "jwt-decode";
import {
  cognitoTokenUrl,
  cognitoTokenCallBody,
  cognitoRefreshCallBody,
} from "../utility/globals";

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

/* eslint-disable @typescript-eslint/no-explicit-any */
export function setTokens(ctx: any, tokens: Tokens) {
  ctx.cookie.access_token.httpOnly = true;
  ctx.cookie.access_token.value = tokens.access_token;
  ctx.cookie.refresh_token.httpOnly = true;
  ctx.cookie.refresh_token.value = tokens.refresh_token;
  if (
    process.env.NODE_ENV == "local" ||
    process.env.NODE_ENV == "local-docker"
  ) {
    ctx.cookie.access_token.secure = false;
    ctx.cookie.refresh_token.secure = false;
    ctx.cookie.access_token.path = "/api";
    ctx.cookie.refresh_token.path = "/api";
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
