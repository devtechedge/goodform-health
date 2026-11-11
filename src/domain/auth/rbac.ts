import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, type DbExecutor } from "@/db/client";
import { auditLogs } from "@/db/schema/content";
import type { UserRole } from "@/db/schema/users";
import {
  resolveSessionUser,
  SESSION_COOKIE_NAME,
  type AuthenticatedUser,
} from "./session";

export type AdminPermission =
  | "admin:access"
  | "products:write"
  | "inventory:write"
  | "compliance:write"
  | "coupons:write"
  | "orders:write"
  | "content:write"
  | "audit:read";

const ROLE_PERMISSIONS: Record<UserRole, readonly AdminPermission[]> = {
  CUSTOMER: [],
  MERCHANDISER: [
    "admin:access",
    "products:write",
    "inventory:write",
    "coupons:write",
    "content:write",
  ],
  COMPLIANCE_OFFICER: ["admin:access", "compliance:write", "audit:read"],
  ADMIN: [
    "admin:access",
    "products:write",
    "inventory:write",
    "compliance:write",
    "coupons:write",
    "orders:write",
    "content:write",
    "audit:read",
  ],
};

export function roleHasPermission(
  role: UserRole,
  permission: AdminPermission,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return resolveSessionUser(raw);
}

export async function requirePageUser(nextPath = "/account"): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function requireAdminPageUser(
  permission: AdminPermission = "admin:access",
): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }
  if (!roleHasPermission(user.role, permission)) {
    redirect("/account?denied=admin");
  }
  return user;
}

export async function writeAuditLog(
  entry: {
    actor: Pick<AuthenticatedUser, "id" | "role">;
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    metadata?: Record<string, unknown>;
  },
  dbOverride?: DbExecutor,
): Promise<void> {
  const db = dbOverride ?? (await getDb());
  await db.insert(auditLogs).values({
    id: `aud_${randomBytes(12).toString("hex")}`,
    actorUserId: entry.actor.id,
    actorRole: entry.actor.role,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    summary: entry.summary,
    metadataJson: entry.metadata ?? {},
  });
}
