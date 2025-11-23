-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asset" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "takeProfit" REAL NOT NULL,
    "stopLoss" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "signalType" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Signal_asset_createdAt_idx" ON "Signal"("asset", "createdAt");

-- CreateIndex
CREATE INDEX "Signal_status_idx" ON "Signal"("status");
