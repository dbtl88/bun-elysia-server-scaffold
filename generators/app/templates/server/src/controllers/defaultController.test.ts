import { describe, expect, it } from "bun:test";
import { initialiseApp } from "../index";

describe("Elysia", () => {
  it("returns a 200 status on GET /", async () => {
    const app = await initialiseApp();

    const response = await app.handle(new Request("http://localhost/"));
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.answer).toBe("okay");
  });

  it("returns a 200 status on POST /record", async () => {
    const app = await initialiseApp();

    const response = await app.handle(
      new Request("http://localhost/record", {
        method: "POST",
        headers: [["content-type", "application/json"]],
        body: JSON.stringify({
          description: "This is a sample record",
        }),
      })
    );
    expect(response.status).toBe(200);
  });
});