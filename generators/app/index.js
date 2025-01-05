import Generator from "yeoman-generator";
import fs from "fs";
import yaml from "js-yaml";
import { execSync } from "child_process";

export default class extends Generator {
  async prompting() {
    this.answers = await this.prompt([
      {
        type: "input",
        name: "configFile",
        message:
          "Please enter a config file name, of the form 'file.yml'. This MUST exist and be a complete yaml file in the required format, in the /generator/cognito/ folder, or the generator will fail.",
        default: "config.yml",
      },
    ]);

    this.configData = null;
    const configFilePath = this.templatePath(`../${this.answers.configFile}`);

    function checkProperty(object, property) {
      if (object[property] == undefined) {
        const error = `Property '${property}' does not exist on in the provided config file.`;
        throw new Error(error);
      }
      console.log(`Config property '${property}' checked.`);
    }

    const configPropertiesToCheck = [
      "projectName",
      "githubUser",
      "ecrRepo",
      "imageName",
      "appRepo",
      "dbConnectionStringLocal",
      "dbConnectionStringLocalDocker",
      "dbConnectionStringTest",
    ];

    if (fs.existsSync(configFilePath)) {
      this.log("Found YAML config file: loading...");
      try {
        const fileContents = fs.readFileSync(configFilePath, "utf8");
        const configData = yaml.load(fileContents);
        configPropertiesToCheck.forEach((property) => {
          checkProperty(configData, property);
        });
        this.answers = configData;
      } catch (error) {
        throw new Error(`Error reading YAML config file. ${error}`);
      }
    } else {
      throw new Error(
        `No YAML config found at ${this.answer.configFile}. Please try again.`
      );
    }
  }

  writing() {
    const projectName = this.answers.projectName;
    const appPath = `${projectName}-server`;
    const pipelinePath = `${projectName}-pipeline-server`;

    this.destinationRoot(this.destinationPath(`${projectName}/${appPath}`));

    // copy folders
    const toCopy = [
      "ansible",
      "api-test",
      "data",
      "db",
      "src",
      "docker_scripts",
      ".gitignore",
      ".env.local",
      ".env.local-docker",
      ".env.test",
      ".env.sandbox",
      ".dockerignore",
      "eslint.config.mjs",
      "buildspec.yml",
      "Dockerfile",
      "postgres-server.crt",
    ];

    toCopy.forEach((name) => {
      this.fs.copyTpl(
        this.templatePath(`server/${name}`),
        this.destinationPath(name),
        {
          projectName: this.answers.projectName,
          ecrRepo: this.answers.ecrRepo,
          imageName: this.answers.imageName,
          dbConnectionStringLocal: this.answers.dbConnectionStringLocal,
          dbConnectionStringLocalDocker:
            this.answers.dbConnectionStringLocalDocker,
          dbConnectionStringTest: this.answers.dbConnectionStringTest,
        }
      );
    });

    const pkgJson = {
      name: "server",
      version: "1.0.0",
      main: "src/index.ts",
      scripts: {
        lint: "eslint",
        test: 'echo "Error: no test specified" && exit 1',
        dev: "bun run --watch src/index.ts",
        "dev:test": "bun --watch test",
        "dev-migrate": "bun run generate && bun db/migrate.ts",
        migrate: "bun run generate && bun ./db/migrate.ts",
        inspect: "bun run --inspect src/index.ts",
        generate: "drizzle-kit generate --config ./db/drizzle.config.ts",
      },
      dependencies: {
        "@elysiajs/cors": "^1.0.2",
        "drizzle-kit": "0.25.0",
        "drizzle-orm": "0.34.1",
        elysia: "latest",
        "generate-password": "^1.7.1",
        "json-to-plain-text": "^1.1.4",
        "node-cache": "^5.1.2",
        parseuri: "^3.0.2",
        pg: "^8.11.3",
        postgres: "^3.4.4",
        typescript: "^5.7.2",
        uuid: "^10.0.0",
        zod: "^3.22.4",
      },
      devDependencies: {
        eslint: "^9.17.0",
        "@eslint/js": "^9.17.0",
        "@types/blob-stream": "^0.1.33",
        "@types/express": "^4.17.21",
        "@types/pdfkit": "^0.13.4",
        "@types/pg": "^8.11.3",
        "@types/uuid": "^9.0.8",
        "@types/bun": "latest",
        prettier: "^3.2.5",
        "typescript-eslint": "^8.19.0",
      },
      module: "src/index.js",
      trustedDependencies: ["es5-ext"],
    };

    fs.writeFileSync(
      this.destinationPath("package.json"),
      JSON.stringify(pkgJson, null, 2)
    );

    this.destinationRoot(this.destinationPath(`../dev-proxy`));

    this.fs.copyTpl(this.templatePath("dev-proxy"), this.destinationPath(), {
      projectName: this.answers.projectName,
      appRepo: this.answers.appRepo,
    });

    this.destinationRoot(this.destinationPath(`../server-scripts`));

    this.fs.copy(this.templatePath("server-scripts"), this.destinationPath());

    this.destinationRoot(this.destinationPath(`../${pipelinePath}`));

    this.fs.copyTpl(this.templatePath("cdk-pipeline"), this.destinationPath(), {
      projectName: this.answers.projectName,
      githubUser: this.answers.githubUser,
      appRepo: this.answers.appRepo,
    });
  }

  install() {
    const projectName = this.answers.projectName;
    const appPath = `${projectName}-server`;
    const pipelinePath = `${projectName}-pipeline-server`;

    try {
      execSync("bun --version", { stdio: "ignore" });
      this.log("Bun is already installed");
    } catch (error) {
      this.log("Bun is not installed, installing...");
      try {
        execSync("curl -fsSL https://bun.sh/install | bash", {
          stdio: "inherit",
        });
        this.log("Bun installed successfully");
      } catch {
        this.log("Bun failed to install. Please install manually.");
        return;
      }
    }

    try {
      execSync("cdk --version", { stdio: "ignore" });
      this.log("CDK is already installed");
    } catch (error) {
      try {
        execSync("bun a -g aws-cdk", { stdio: "ignore" });
      } catch (error) {
        this.log("Failed. CDK could not be installed");
      }
      this.log("CDK is not installed, installing...");
    }

    // the generator is still in the pipeline folder at this point, but the files have been written, so doing bun install works

    this.spawnSync("bun", ["install"]);

    // Need to be super careful with traversing folder structure / that parent dir is original root, as expected.

    this.destinationRoot(this.destinationPath(`../${appPath}`));
    this.spawnSync("bun", ["install"]);
    this.spawnSync("git", ["init"]);
    this.spawnSync("git", ["add", "."]);
    this.spawnSync("git", ["commit", "-m", "'first commit'"]);
    this.spawnSync("gh", [
      "repo",
      "create",
      this.answers.appRepo,
      "--private",
      "--source=.",
      "--push",
    ]);

    // Remember to go back to the pipeline directory before doing cdk actions!
    this.destinationRoot(this.destinationPath(`../${pipelinePath}`));
    this.spawnSync("cdk", ["deploy", "--all"]);
  }
}
