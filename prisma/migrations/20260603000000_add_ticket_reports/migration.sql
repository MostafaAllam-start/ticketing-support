-- CreateTable
CREATE TABLE "ticket_reports" (
    "id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "issue" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_reports_ticket_id_idx" ON "ticket_reports"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_reports_user_id_idx" ON "ticket_reports"("user_id");

-- AddForeignKey
ALTER TABLE "ticket_reports" ADD CONSTRAINT "ticket_reports_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_reports" ADD CONSTRAINT "ticket_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
