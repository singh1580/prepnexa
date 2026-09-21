export const testCategoryLabels = {
  FULL_MOCK: "Full mock",
  SUBJECT_TEST: "Subject test",
  TOPIC_SET: "Topic set",
} as const;
export type TestCategory = keyof typeof testCategoryLabels;
export function testCategoryLabel(category: TestCategory | null) {
  return category ? testCategoryLabels[category] : "Uncategorised";
}
