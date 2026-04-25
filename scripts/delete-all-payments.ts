import { db } from "../packages/db/src/client";
import { payments, orders } from "../packages/db/src/schema";

async function deleteAllPayments() {
  console.log("Deleting all payments and orders...");
  await db.delete(payments);
  await db.delete(orders);
  console.log("All payments and orders deleted successfully.");
  process.exit(0);
}

deleteAllPayments().catch((error) => {
  console.error("Error deleting payments:", error);
  process.exit(1);
});
