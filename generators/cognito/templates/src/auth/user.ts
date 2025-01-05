import { authenticate, verifyId } from "./verify-jwt";
import { createUser, getUserById } from "../../data/users";

interface UserInfo {
  userId: string;
  email: string;
}

export async function verifyAndReturnUserInfo(
  access_token: string
): Promise<UserInfo | undefined> {
  const payload = await authenticate(access_token);
  if (payload?.sub) {
    const user = await getUserById(payload.sub);
    if (user) {
      return {
        userId: user.cognitoId,
        email: user.email,
      };
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function verifyAndCreateUser(id_token: string): Promise<boolean> {
  const payload = (await verifyId(id_token)) as any;
  if (payload.sub) {
    const user = await getUserById(payload.sub);
    if (!user) {
      console.log("creating user");
      const createdUser = await createUser({
        cognitoId: payload.sub,
        email: payload.email,
      });
      if (createdUser) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  } else return false;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
