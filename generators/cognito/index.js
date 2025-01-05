import Generator from "yeoman-generator";
import fs from "fs";
import yaml from "js-yaml";

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
      "testDomain",
      "sandboxDomain",
      "prodDomain",
      "cognitoUserPoolIdLocal",
      "cognitoUserPoolClientIdLocal",
      "cognitoDomainLocal",
      "cognitoUserPoolIdTest",
      "cognitoUserPoolClientIdTest",
      "cognitoDomainTest",
      "cognitoUserPoolIdSandbox",
      "cognitoUserPoolClientIdSandbox",
      "cognitoDomainSandbox",
      "cognitoUserPoolIdProd",
      "cognitoUserPoolClientIdProd",
      "cognitoDomainProd",
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

  // Need to find a way to ensure invocation from server directory, as everything else is relative
  writing() {
    const pkgJson = {
      dependencies: {
        "@aws-sdk/client-cognito-identity-provider": "^3.540.0",
        "@aws-sdk/client-kms": "^3.540.0",
        "aws-jwt-verify": "^4.0.1",
        "jwt-decode": "^4.0.0",
      },
    };
    this.fs.extendJSON(this.destinationPath("package.json"), pkgJson);

    const files = [
      "src/auth/verify-jwt.ts",
      "src/auth/oauth.ts",
      "src/auth/user.ts",
      "src/utility/globals.ts",
      "src/controllers/authUserRequired.ts",
      "src/controllers/authController.ts",
      "db/schema/userSchema.ts",
      "data/users.ts",
    ];

    files.forEach((name) => {
      console.log(`Deleting: ${this.destinationPath(name)}`);
      this.fs.delete(this.destinationPath(name));
    });

    this.fs.commit();

    files.forEach((path) => {
      this.fs.copy(this.templatePath(path), this.destinationPath(path));
    });

    const jsonControllersPath = this.destinationPath("src/controllers.json");
    if (this.fs.exists(jsonControllersPath)) {
      var jsonArray = this.fs.readJSON(jsonControllersPath, []);
      jsonArray.push("./controllers/authUserRequired");
      jsonArray.push("./controllers/authController");
      this.fs.writeJSON(jsonControllersPath, jsonArray);
    }

    const jsonSchemaPath = this.destinationPath("db/schemata.json");
    if (this.fs.exists(jsonSchemaPath)) {
      var jsonArray = this.fs.readJSON(jsonSchemaPath, []);
      jsonArray.push("./db/schema/userSchema");
      this.fs.writeJSON(jsonSchemaPath, jsonArray);
    }

    const schemaFilePath = this.destinationPath("db/schema.ts");
    const userSchemaLine = `\nexport * from "./schema/userSchema";`;

    try {
      fs.appendFileSync(schemaFilePath, userSchemaLine, "utf8");
      this.log("Successfully appended to schema.ts");
    } catch (err) {
      this.log.error(`Failed to append to schema.ts: ${err.message}`);
    }

    const files2 = [
      {
        file: ".env",
        vars: {
          userPoolId: this.answers.cognitoUserPoolIdProd,
          userPoolClientId: this.answers.cognitoUserPoolClientIdProd,
          cognitoUrl: this.answers.cognitoDomainProd,
          cognitoRedirectUri: encodeURIComponent(
            `https://${this.answers.prodDomain}/login`
          ),
        },
      },
      {
        file: ".env.test",
        vars: {
          userPoolId: this.answers.cognitoUserPoolIdTest,
          userPoolClientId: this.answers.cognitoUserPoolClientIdTest,
          cognitoUrl: this.answers.cognitoDomainTest,
          cognitoRedirectUri: encodeURIComponent(
            `https://${this.answers.testDomain}/login`
          ),
          dbConnectionStringTest: this.answers.dbConnectionStringTest,
        },
      },
      {
        file: ".env.sandbox",
        vars: {
          userPoolId: this.answers.cognitoUserPoolIdSandbox,
          userPoolClientId: this.answers.cognitoUserPoolClientIdSandbox,
          cognitoUrl: this.answers.cognitoDomainSandbox,
          cognitoRedirectUri: encodeURIComponent(
            `https://${this.answers.sandboxDomain}/login`
          ),
        },
      },
      {
        file: ".env.local",
        vars: {
          userPoolId: this.answers.cognitoUserPoolIdTest,
          userPoolClientId: this.answers.cognitoUserPoolClientIdTest,
          cognitoUrl: this.answers.cognitoDomainTest,
          cognitoRedirectUri: encodeURIComponent(`http://localhost/login`),
          dbConnectionStringLocal: this.answers.dbConnectionStringLocal,
        },
      },
      {
        file: ".env.local-docker",
        vars: {
          userPoolId: this.answers.cognitoUserPoolIdTest,
          userPoolClientId: this.answers.cognitoUserPoolClientIdTest,
          cognitoUrl: this.answers.cognitoDomainTest,
          cognitoRedirectUri: encodeURIComponent(`http://localhost/login`),
          dbConnectionStringLocalDocker:
            this.answers.dbConnectionStringLocalDocker,
        },
      },
    ];

    files2.forEach((item) => {
      console.log(`Deleting: ${this.destinationPath(item.file)}`);
      this.fs.delete(this.destinationPath(item.file));
    });

    this.fs.commit();

    files2.forEach((item) => {
      this.fs.copyTpl(
        this.templatePath(item.file),
        this.destinationPath(item.file),
        item.vars
      );
    });
  }

  install() {
    this.spawnSync("bun", ["install"]);
    this.spawnSync("bun", ["run", "dev-migrate"]);
    this.spawnSync("git", ["add", "."]);
    this.spawnSync("git", ["commit", "-m", "added cognito scaffolds"]);
    this.spawnSync("git", ["push", "origin", "main"]);
  }
}
