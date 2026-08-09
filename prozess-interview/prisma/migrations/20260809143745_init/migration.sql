-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessVersion" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "transcript" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "ir" JSONB NOT NULL,
    "assessment" JSONB NOT NULL,
    "bpmnXml" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessVersion_processId_idx" ON "ProcessVersion"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessVersion_processId_version_key" ON "ProcessVersion"("processId", "version");

-- AddForeignKey
ALTER TABLE "ProcessVersion" ADD CONSTRAINT "ProcessVersion_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;
