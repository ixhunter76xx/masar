import assert from "node:assert/strict";

import { appPageTransitionKey } from "../src/lib/motion";

const courseId = "course-123";
const stableKey = `/learn/${courseId}/(tabs)`;

for (const pathname of [
  `/learn/${courseId}`,
  `/learn/${courseId}/announcements`,
  `/learn/${courseId}/grades`,
  `/learn/${courseId}/messages`,
  `/learn/${courseId}/messages/conversation-456`,
]) {
  assert.equal(
    appPageTransitionKey(pathname),
    stableKey,
    `${pathname} يجب أن يبقي رأس المقرر مركّبًا`,
  );
}

for (const pathname of [
  "/learn",
  `/learn/${courseId}/quizzes/quiz-1`,
  `/learn/${courseId}/assignments/assignment-1`,
  "/orders",
  "/courses",
]) {
  assert.equal(
    appPageTransitionKey(pathname),
    pathname,
    `${pathname} يجب أن يبقى انتقال صفحة مستقلًا`,
  );
}

assert.notEqual(
  appPageTransitionKey("/learn/course-a/grades"),
  appPageTransitionKey("/learn/course-b/grades"),
  "لا يجوز أن تشترك مقررات مختلفة في مفتاح انتقال واحد",
);

console.log("COURSE TRANSITION REGRESSION PASS");
