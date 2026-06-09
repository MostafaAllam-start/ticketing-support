-- CreateTable
CREATE TABLE "_CompanyToPartner" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CompanyToPartner_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CompanyToPartner_B_index" ON "_CompanyToPartner"("B");

-- AddForeignKey
ALTER TABLE "_CompanyToPartner" ADD CONSTRAINT "_CompanyToPartner_A_fkey" FOREIGN KEY ("A") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToPartner" ADD CONSTRAINT "_CompanyToPartner_B_fkey" FOREIGN KEY ("B") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
