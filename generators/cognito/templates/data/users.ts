import * as schema from "../db/schema";
import { db } from "../db/db";
import { User, NewUser } from "../db/types";
import { eq } from "drizzle-orm";

export async function getUserById(id: string): Promise<User | undefined> {
    const user = await db.query.users.findFirst({where: eq(schema.users.cognitoId, id)});
    return user;
  }

export async function createUser(user: NewUser): Promise<User | undefined> {
    const newUser = await db.insert(schema.users).values(user).returning();
    return newUser[0];
  }