import { Elysia, t } from "elysia";
import { createRecord, getRecords } from "../../data/records";
import { NewRecord } from "../../db/types";

const defaultController = new Elysia()
  .get("/", () => {
    console.log("running test route");
    return {
      answer: "okay",
    };
  })
  .get("/record", async () => {
    const records = await getRecords();
    return {
      records: records,
    };
  })
  .post(
    "/record",
    async ({ body, set }) => {
      try {
        await createRecord(body as NewRecord);
        set.status = 200;
      } catch (error) {
        set.status = 400;
        console.error(`Error: ${error}`);
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
  );

export default defaultController;
