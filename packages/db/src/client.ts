import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@academy/config";
import * as schema from "./schema";

const sql = neon(env.postgresUrl);

export const db = drizzle({ client: sql, schema });

export type DatabaseClient = typeof db;
