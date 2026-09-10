import { neon } from "@neondatabase/serverless";

function databaseUrl() {
  const value = process.env.POSTGRES_URL;
  if (!value) throw new Error("POSTGRES_URL is not configured");
  return value;
}

export function getSql() {
  return neon(databaseUrl());
}
