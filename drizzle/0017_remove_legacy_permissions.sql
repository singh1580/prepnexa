DELETE FROM "role_permissions"
WHERE "permission_id" IN (
  SELECT "id" FROM "permissions"
  WHERE "key" IN ('exam.manage', 'question.review', 'question.publish')
);--> statement-breakpoint
DELETE FROM "permissions"
WHERE "key" IN ('exam.manage', 'question.review', 'question.publish');
