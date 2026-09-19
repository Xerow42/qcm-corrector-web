import type { DbClass } from "@/types";
import { apiGet } from "./http";

export async function fetchClasses(): Promise<DbClass[]> {
  const payload = await apiGet<{ classes: DbClass[] }>("/api/admin/classes");
  return payload.classes;
}
