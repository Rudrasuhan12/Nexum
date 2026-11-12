import { prisma } from "../src/prisma.js";

async function main() {
  console.log("Applying append-only database triggers to PostgreSQL...");

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION guard_ledger_entries_immutable()
    RETURNS TRIGGER AS $$
    BEGIN
        RAISE EXCEPTION 'Ledger entries are strictly append-only and cannot be updated or deleted';
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS trg_guard_ledger_entries_immutable ON "ledger_entries";
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_guard_ledger_entries_immutable
    BEFORE UPDATE OR DELETE ON "ledger_entries"
    FOR EACH ROW EXECUTE FUNCTION guard_ledger_entries_immutable();
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION guard_payment_events_immutable()
    RETURNS TRIGGER AS $$
    BEGIN
        RAISE EXCEPTION 'Payment events are strictly append-only and cannot be updated or deleted';
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS trg_guard_payment_events_immutable ON "payment_events";
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_guard_payment_events_immutable
    BEFORE UPDATE OR DELETE ON "payment_events"
    FOR EACH ROW EXECUTE FUNCTION guard_payment_events_immutable();
  `);

  console.log("✅ Successfully applied immutable ledger & payment event triggers!");
}

main()
  .catch((e) => {
    console.error("Trigger error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
