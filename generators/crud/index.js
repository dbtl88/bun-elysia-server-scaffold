// TODO: DONE schema export; DONE types; DONE controllers JSON
import Generator from "yeoman-generator";
import fs from "fs";

export default class extends Generator {
  async prompting() {
    this.answers = await this.prompt([
      {
        type: "input",
        name: "objectName",
        message: "Please enter a new name for your new object type",
      },
    ]);
  }

  writing() {
    const name = this.answers.objectName
    const capitalised = (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    const toCopy = [
      {
        file: "objectController.ts",
        destination: `src/controllers/${name}Controller.ts`,
      },
      {
        file: "objects.ts",
        destination: `data/${name}s.ts`,
      },
      {
        file: "objectSchema.ts",
        destination: `db/schema/${name}Schema.ts`,
      },
    ];

    toCopy.forEach((item) => {
      this.fs.copyTpl(
        this.templatePath(item.file),
        this.destinationPath(item.destination),
        {
          objectName: name,
          ObjectName: capitalised(name),
        }
      );
    });

    const jsonControllersPath = this.destinationPath("src/controllers.json");
    if (this.fs.exists(jsonControllersPath)) {
      var jsonArray = this.fs.readJSON(jsonControllersPath, []);
      jsonArray.push(`./controllers/${name}Controller`);
      this.fs.writeJSON(jsonControllersPath, jsonArray);
    }

    const schemaFilePath = this.destinationPath("db/schema.ts");
    const objectSchemaLine = `\nexport * from "./schema/${name}Schema.ts";`;

    try {
      fs.appendFileSync(schemaFilePath, objectSchemaLine, "utf8");
      this.log("Successfully appended to schema.ts");
    } catch (err) {
      this.log.error(`Failed to append to schema.ts: ${err.message}`);
    }
    
    const typesFilePath = this.destinationPath("db/types.ts");
    const objectTypeLine = `\nexport type ${capitalised(name)} = typeof schema.${name}s.$inferSelect;\nexport type New${capitalised(name)} = typeof schema.${name}s.$inferInsert;`

    try {
        fs.appendFileSync(typesFilePath, objectTypeLine, "utf8");
        this.log("Successfully appended to types.ts");
      } catch (err) {
        this.log.error(`Failed to append to types.ts: ${err.message}`);
      }
  }

  install() {
    this.spawnSync("bun", ["run", "dev-migrate"]);
  }
}