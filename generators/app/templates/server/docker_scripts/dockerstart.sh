#!/bin/sh
bun run generate
bun ./db/migrate.ts
bun run ./src/index.ts