import { Elysia } from "elysia";
import controllers from "../src/controllers.json";

const port = () => {
  console.log(`NODE_ENV = ${process.env.NODE_ENV}`);
  switch (process.env.NODE_ENV) {
    case "local":
      return 443;
    case "test":
      return 443;
    default:
      return 9000;
  }
};

// use json of objects in separate file, then extend this, then map

export const initialiseApp = async () => {
  const app = new Elysia({ prefix: "/api" });

  for (const controllerPath of controllers) {
    try {
      const module = await import(controllerPath);
      // Chain the controller use call
      app.use(module.default);
    } catch (err) {
      console.error(`Failed to import controller at ${controllerPath}\n${err}`);
    }
  }

  return app;
};

initialiseApp().then((app) => {
  Bun.serve({
    port: port(),
    reusePort: true,
    fetch: (request) => {
      return app.handle(request);
    },
  });
});
