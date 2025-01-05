import * as schema from "../db/schema";
import { db } from "../db/db";
import { New<%=ObjectName%>, <%=ObjectName%> } from "../db/types";
import { eq } from "drizzle-orm";

export async function getAll<%=ObjectName%>s(): Promise<<%=ObjectName%>[]> {
  const <%=objectName%>s = await db.query.<%=objectName%>s.findMany();
  return <%=objectName%>s;
}

export async function create<%=ObjectName%>(<%=objectName%>: New<%=ObjectName%>) {
  await db.insert(schema.<%=objectName%>s).values(<%=objectName%>);
  return;
}
export async function get<%=ObjectName%>(id: number) {
  const <%=objectName%> = await db.query.<%=objectName%>s.findFirst({
    where: eq(schema.<%=objectName%>s.id, id),
  });
  return <%=objectName%>;
}
export async function delete<%=ObjectName%>(id: number) {
  await db.delete(schema.<%=objectName%>s).where(eq(schema.<%=objectName%>s.id, id));
  return;
}
export async function update<%=ObjectName%>(id: number, <%=objectName%>: New<%=ObjectName%>) {
  await db.update(schema.<%=objectName%>s).set(<%=objectName%>).where(eq(schema.<%=objectName%>s.id, id)) ;
  return;
}
