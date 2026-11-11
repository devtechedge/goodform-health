import { SKUS_BATCH_1 } from "./skus-batch-1";
import { SKUS_BATCH_2 } from "./skus-batch-2";
import { SKUS_BATCH_3 } from "./skus-batch-3";
import type { SeedProductInput } from "./types";

export const ALL_40_SKUS: readonly SeedProductInput[] = [
  ...SKUS_BATCH_1,
  ...SKUS_BATCH_2,
  ...SKUS_BATCH_3,
];

if (ALL_40_SKUS.length !== 40) {
  throw new Error(
    `GOODFORM catalogue invariant violated: expected exactly 40 SKUs, found ${ALL_40_SKUS.length}`,
  );
}
