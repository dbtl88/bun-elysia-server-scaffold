import { Elysia, t } from "elysia";
import {
  get<%=ObjectName%>,
  create<%=ObjectName%>,
  update<%=ObjectName%>,
  delete<%=ObjectName%>,
  getAll<%=ObjectName%>s,
} from "../../data/<%=objectName%>s";
import { New<%=ObjectName%>, <%=ObjectName%> } from "../../db/types";

const defaultController = new Elysia({ prefix: "/<%=objectName%>s" })
  .get("/", async () => {
    const records = await getAll<%=ObjectName%>s();
    return records;
  })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const records = await create<%=ObjectName%>(body as New<%=ObjectName%>);
        set.status = 200;
      } catch (error) {
        set.status = 400;
        return {
          error: JSON.stringify(error),
        };
      }
    },
    {
      body: t.Object({
        description: t.String(),
      }),
    }
  )
  .get(
    "/:id",
    async ({ params: { id } }) => {
      const record = await get<%=ObjectName%>(id);
      return record;
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
    }
  )
  .put(
    "/:id",
    async ({ body, set, params: { id } }) => {
      try {
        const records = await update<%=ObjectName%>(id, body as New<%=ObjectName%>);
        set.status = 200;
      } catch (error) {
        set.status = 400;
        return {
          error: JSON.stringify(error),
        };
      }
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      body: t.Object({
        description: t.String(),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      const records = await delete<%=ObjectName%>(id);
      return {
        records: records,
      };
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
    }
  );

export default defaultController;
