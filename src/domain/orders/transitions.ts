import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb, type Database } from "@/db/client";
import { productVariants } from "@/db/schema/catalog";
import {
  orderItems,
  orders,
  returnRequests,
  type OrderStatus,
  type ReturnStatus,
} from "@/db/schema/commerce";
import { writeAuditLog } from "@/domain/auth/rbac";
import type { AuthenticatedUser } from "@/domain/auth/session";
import { OrderDomainError } from "./service";

const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  DEMO_ORDER: ["PACKED", "SHIPPED", "DELIVERED", "RETURN_REQUESTED", "CANCELLED"],
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURN_REQUESTED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "DELIVERED"],
  RETURNED: [],
  CANCELLED: [],
};

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function createCustomerReturnRequest(
  userId: string,
  orderId: string,
  reason: string,
  details: string,
  dbOverride?: Database,
) {
  const db = dbOverride ?? (await getDb());
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

  if (!order) {
    throw new OrderDomainError("NOT_FOUND", "Order not found.");
  }
  if (order.userId !== userId) {
    throw new OrderDomainError("FORBIDDEN", "Not authorised for this order.");
  }

  const eligibleForReturn: OrderStatus[] = [
    "DEMO_ORDER",
    "SHIPPED",
    "DELIVERED",
  ];
  if (!eligibleForReturn.includes(order.orderStatus)) {
    throw new Error(
      `Order ${order.orderNumber} in status ${order.orderStatus} cannot open a return request.`,
    );
  }

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(returnRequests)
      .where(eq(returnRequests.orderId, orderId));

    if (existing) {
      return existing;
    }

    const [created] = await tx
      .insert(returnRequests)
      .values({
        id: `ret_${randomBytes(12).toString("hex")}`,
        orderId,
        userId,
        reason: reason.trim(),
        details: details.trim(),
        status: "REQUESTED",
        refundPaise: order.totalPaise,
      })
      .returning();

    await tx
      .update(orders)
      .set({ orderStatus: "RETURN_REQUESTED", updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return created!;
  });
}

export async function adminTransitionOrderStatus(
  actor: Pick<AuthenticatedUser, "id" | "role">,
  orderId: string,
  nextStatus: OrderStatus,
  dbOverride?: Database,
) {
  const db = dbOverride ?? (await getDb());

  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      throw new OrderDomainError("NOT_FOUND", "Order not found.");
    }

    if (!canTransitionOrderStatus(order.orderStatus, nextStatus)) {
      throw new Error(
        `Invalid order transition from ${order.orderStatus} to ${nextStatus}.`,
      );
    }

    // Restore stock once when transitioning into CANCELLED
    if (order.orderStatus !== "CANCELLED" && nextStatus === "CANCELLED") {
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        if (item.variantId) {
          await tx
            .update(productVariants)
            .set({
              stockOnHand: sql`${productVariants.stockOnHand} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(productVariants.id, item.variantId));
        }
      }
    }

    const [updated] = await tx
      .update(orders)
      .set({ orderStatus: nextStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    await writeAuditLog(
      {
        actor,
        action: "ORDER_STATUS_TRANSITION",
        entityType: "order",
        entityId: orderId,
        summary: `Transitioned order ${order.orderNumber} from ${order.orderStatus} to ${nextStatus}`,
        metadata: { from: order.orderStatus, to: nextStatus },
      },
      tx,
    );

    return updated!;
  });
}

export async function adminResolveReturnRequest(
  actor: Pick<AuthenticatedUser, "id" | "role">,
  returnId: string,
  nextStatus: ReturnStatus,
  adminNotes: string,
  dbOverride?: Database,
) {
  const db = dbOverride ?? (await getDb());

  return db.transaction(async (tx) => {
    const [ret] = await tx
      .select()
      .from(returnRequests)
      .where(eq(returnRequests.id, returnId));

    if (!ret) {
      throw new OrderDomainError("NOT_FOUND", "Return request not found.");
    }

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, ret.orderId));

    const [updated] = await tx
      .update(returnRequests)
      .set({
        status: nextStatus,
        adminNotes: adminNotes.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(returnRequests.id, returnId))
      .returning();

    if (order && nextStatus === "REFUNDED") {
      await tx
        .update(orders)
        .set({
          orderStatus: "RETURNED",
          // Demo orders never had a real charge, so only real captured payments transition to REFUNDED
          paymentStatus: order.isDemoOrder ? "DEMO_NON_CHARGING" : "REFUNDED",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
    }

    await writeAuditLog(
      {
        actor,
        action: "RETURN_RESOLUTION",
        entityType: "return_request",
        entityId: returnId,
        summary: `Updated return request ${returnId} to ${nextStatus}`,
        metadata: { status: nextStatus, orderId: ret.orderId },
      },
      tx,
    );

    return updated!;
  });
}
