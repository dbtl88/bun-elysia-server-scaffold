import { Elysia, t } from "elysia";
import { checkAndRefreshTokens, getTokens, setTokens } from "../auth/oauth";
import { verifyAndCreateUser, verifyAndReturnUserInfo } from "../auth/user";
import { authenticate } from "../auth/verify-jwt";

const defaultController = new Elysia({ prefix: "/auth" })
  .get(
    "/login-code",
    async ({ set, cookie: { access_token, refresh_token }, query: { code }}) => {
      const auth = await getTokens(code);
      if (auth) {
        const userExists = await verifyAndCreateUser(auth.id_token)
        if (userExists) {
          access_token.httpOnly = true;
          access_token.value = auth.access_token;
          access_token.path = "/api"
          refresh_token.httpOnly = true;
          refresh_token.value = auth.refresh_token;
          refresh_token.path = "/api"
          if (process.env.NODE_ENV == "local" || process.env.NODE_ENV == "local-docker") {
            access_token.secure = false;
            refresh_token.secure = false;
          }
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
  .get("/status", async (ctx) => {
    if (ctx.cookie.access_token.value && ctx.cookie.refresh_token.value) {
      const newTokens = await checkAndRefreshTokens({
        access_token: ctx.cookie.access_token.value,
        refresh_token: ctx.cookie.refresh_token.value
      })
      setTokens(ctx, newTokens)

      const foundUser = await verifyAndReturnUserInfo(newTokens.access_token)
      return {
        authenticated: true,
        user: foundUser
      }
    } else {
      return {
        authenticated: false,
        user: {}
      }
    }
  })
  .get("/logout", async ({ set, cookie: { access_token, refresh_token }}) => {
    access_token.path = "/api"
    refresh_token.path = "/api"
    access_token.remove()
    refresh_token.remove()
    set.status = 200
  })
  .get("/authenticated", async ({ set, cookie: { access_token } }) => {
    if (access_token.value) {
      console.log(
        `Authenticated route. Cookie 'auth_token' has value ${access_token.value}.`
      );
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
  })

export default defaultController;
