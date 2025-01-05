import { Elysia, t } from "elysia";
import { authAndReturnUser } from "../auth/verify-jwt";
// import { getUserById } from "../data/users";
import type Context from "elysia";

type ContextWithUser = Partial<Context> & { user: string };
// type ContextWithUserAndParams = Partial<Context> & { user: string } & {
//   params: Record<"id", string>;
// };

const authUserRequired = new Elysia().guard(
  {
    headers: t.Object({
      authorization: t.String(),
    }),
  },
  (app) =>
    app.guard(
      {
        beforeHandle: verifyAndReturnUser,
      },
      (app) =>
        app.get("/authorised", async ({ user }: ContextWithUser) => {
          console.log(user);
          return {
            body: user,
          };
        })
    )
);

/* eslint-disable @typescript-eslint/no-explicit-any */
async function verifyAndReturnUser(ctx: any) {
  const user = await authAndReturnUser(ctx.headers.authorization);
  if (user) {
    return {
      user: user,
    };
  } else {
    return (ctx.set.status = "Unauthorized");
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default authUserRequired;
