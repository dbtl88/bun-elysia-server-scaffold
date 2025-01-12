import { Elysia, t } from "elysia";
import {
  checkAndRefreshTokens,
  getTokens,
  setAuthCookies,
  unsetCookies,
} from "../auth/oauth";
import { verifyAndCreateUser, verifyAndReturnUserInfo } from "../auth/user";
import { authenticate } from "../auth/verify-jwt";

const cookiesPath = "/api";

const defaultController = new Elysia({ prefix: "/auth" })
  .get(
    "/login-code",
    async ({
      set,
      cookie: { access_token, refresh_token },
      query: { code },
    }) => {
      console.log("starting to log in...");
      const auth = await getTokens(code);
      if (auth) {
        const userExists = await verifyAndCreateUser(auth.id_token);
        if (userExists) {
          setAuthCookies(access_token, refresh_token, auth, cookiesPath);
          set.status = 200;
        } else {
          set.status = 401;
        }
      } else {
        set.status = 401;
      }
    },
    {
      query: t.Object({
        code: t.String(),
      }),
    }
  )
  .get("/status", async ({ cookie: { refresh_token, access_token } }) => {
    if (access_token.value && refresh_token.value) {
      const newTokens = await checkAndRefreshTokens({
        access_token: access_token.value,
        refresh_token: refresh_token.value,
      });
      setAuthCookies(access_token, refresh_token, newTokens, cookiesPath);

      const foundUser = await verifyAndReturnUserInfo(newTokens.access_token);
      return {
        authenticated: true,
        user: foundUser,
      };
    } else {
      return {
        authenticated: false,
        user: {},
      };
    }
  })
  .get("/logout", async ({ set, cookie: { access_token, refresh_token } }) => {
    unsetCookies([access_token, refresh_token], cookiesPath);
    set.status = 200;
  })
  .get("/authenticated", async ({ set, cookie: { access_token } }) => {
    console.log(
      `Authenticated route. Cookie 'auth_token' has value ${access_token.value}.`
    );
    if (access_token.value) {
      try {
        const auth = await authenticate(access_token.value);
        console.log(`authed successfully ${JSON.stringify(auth)}`);
        return 200;
      } catch (err) {
        console.log(`error verifying auth jwt: ${err}`);
        set.status = 401;
      }
      set.status = 200;
    } else {
      console.log(`Authenticated route. Cookie 'auth_token' not set.`);
      set.status = 401;
    }
  });

export default defaultController;
