import { products, productVariants } from "./catalog";

export { products, productVariants };
export type ProductRow = typeof products.$inferSelect;
export type ProductVariantRow = typeof productVariants.$inferSelect;
