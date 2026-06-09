-- CreateTable
CREATE TABLE "_CompanyToTeamMember" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CompanyToTeamMember_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CompanyToTeamMember_B_index" ON "_CompanyToTeamMember"("B");

-- AddForeignKey
ALTER TABLE "_CompanyToTeamMember" ADD CONSTRAINT "_CompanyToTeamMember_A_fkey" FOREIGN KEY ("A") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToTeamMember" ADD CONSTRAINT "_CompanyToTeamMember_B_fkey" FOREIGN KEY ("B") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
