"use server";

import { revalidatePath } from "next/cache";

import { markThreadRead, sendMessage } from "@/lib/data/messages";

/**
 * إرسال رسالة داخل محادثة مقرر.
 *
 * لا يتحقّق من الصلاحية هنا: `sendMessage` هي من تفعل، وهي الطبقة التي
 * لا يمكن تجاوزها. تكرار التحقّق في الإجراء يعني مكانين قد يفترقان.
 */
export async function sendCourseMessage(
  courseId: string,
  studentId: string,
  body: string,
) {
  const result = await sendMessage(courseId, studentId, body);
  if (!result.ok) return result;

  revalidatePath(`/learn/${courseId}/messages`);
  revalidatePath(`/learn/${courseId}/messages/${studentId}`);
  revalidatePath("/messages");
  // العدّاد في الشريط الجانبي يعيش في التخطيط الجذري
  revalidatePath("/", "layout");
  return result;
}

/** تعليم ما وصل من الطرف الآخر كمقروء بعد عرض المحادثة */
export async function markCourseThreadRead(
  courseId: string,
  studentId: string,
) {
  const count = await markThreadRead(courseId, studentId);
  if (count > 0) revalidatePath("/", "layout");
  return count;
}
