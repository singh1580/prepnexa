import type { StudentCourse } from "./repository";

type CourseProgress = Pick<StudentCourse, "testCount" | "materialCount" | "completedTests" | "viewedMaterialCount">;

export function courseProgress(course: CourseProgress) {
  const total = course.testCount + course.materialCount;
  if (!total) return 0;
  const completed = Math.min(course.completedTests, course.testCount) + Math.min(course.viewedMaterialCount, course.materialCount);
  return Math.round(completed / total * 100);
}
