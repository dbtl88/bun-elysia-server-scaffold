import { CognitoJwtVerifier } from "aws-jwt-verify";
import { JwtPayload } from "jwt-decode";

const {USER_POOL_ID, USER_POOL_CLIENT_ID} = process.env;

const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID!,
  tokenUse: "access",
  clientId: USER_POOL_CLIENT_ID!,
});

const idVerifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID!,
  tokenUse: "id",
  clientId: USER_POOL_CLIENT_ID!,
});

async function authenticate(token: string): Promise<JwtPayload | undefined> {
  try {
    const payload = await verifier.verify(
        token
      );
    console.log("Token is valid. Payload:", payload);
    return payload
  } catch {
    console.log("Token not valid!");
    return undefined
  }
}

export async function verifyId(token: string): Promise<JwtPayload | undefined> {
  try {
    const payload = await idVerifier.verify(
        token
      );
    return payload
  } catch {
    console.log("Token not valid!");
    return undefined
  }
}

async function authAndCheckAdmin(token: string): Promise<boolean> {
  try {
    const payload = await verifier.verify(
        token
      );
    if (payload["cognito:groups"]?.includes('admins')) {
      return true
    } else {
      return false
    }
  } catch {
    return false
  }
}

async function authAndReturnUser(token: string): Promise<string | undefined> {
  try {
    const payload = await verifier.verify(
        token
      );
      return payload.username
  } catch {
    return undefined
  }
}

export { authenticate, authAndCheckAdmin, authAndReturnUser }