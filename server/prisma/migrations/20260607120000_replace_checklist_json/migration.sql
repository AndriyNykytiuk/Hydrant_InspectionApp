-- Replace the per-question boolean columns with a single JSON map of answers.
-- The new inspection question set is defined in the client checklist; old
-- per-question answers are not portable to the new questions and are dropped.
-- `isWorking` (overall state) and `weakness` (free text) are preserved.

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "checks" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "Inspection"
  DROP COLUMN "cleanPath",
  DROP COLUMN "banner",
  DROP COLUMN "coverFreeOk",
  DROP COLUMN "parkingFreeOk",
  DROP COLUMN "lidOk",
  DROP COLUMN "bodyOk",
  DROP COLUMN "patrubCapOk",
  DROP COLUMN "stockOk",
  DROP COLUMN "tightnessOk",
  DROP COLUMN "threadOk",
  DROP COLUMN "stockHeightOk",
  DROP COLUMN "waterStartOk",
  DROP COLUMN "pressureOk",
  DROP COLUMN "flowRateOk",
  DROP COLUMN "waterCleanOk",
  DROP COLUMN "waterHitOk",
  DROP COLUMN "drainValveOk",
  DROP COLUMN "wellDepthOk",
  DROP COLUMN "wellInsulationOk",
  DROP COLUMN "wellDryOk",
  DROP COLUMN "wellNeckOk",
  DROP COLUMN "signReadableOk",
  DROP COLUMN "signMatchesOk",
  DROP COLUMN "signLocationOk";
