-- Previous versions marked deleted results with deleted_at, which kept the
-- unique slug reserved. Purge those already-deleted rows so Life IDs can be reused.
DELETE FROM saju_results
WHERE deleted_at IS NOT NULL;
