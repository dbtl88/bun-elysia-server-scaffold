import * as schema from "../db/schema";
import { db } from "../db/db";
import { Record, NewRecord } from "../db/types";

export async function getRecords(): Promise<Record[]> {
    const products = await db.query.records.findMany();
    return products;
  }

export async function createRecord(record: NewRecord) {
    await db.insert(schema.records).values(record);
    return;
  }