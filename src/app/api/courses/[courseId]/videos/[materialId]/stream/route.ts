import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPlaybackUrl } from "@/server/video-url";

/**
 * نقطة تشغيل الفيديو.
 *
 * تتحقق من الصلاحية ثم تُحوّل (302) إلى رابط R2 موقّع مؤقتًا.
 * الفائدة على وضع الرابط الموقّع مباشرةً في HTML:
 *   • لا يظهر رابط حامل للصلاحية في مصدر الصفحة
 *   • تُفحص الصلاحية عند كل طلب تشغيل لا مرة واحدة عند العرض
 *   • طلبات النطاق (seeking) تعمل: المتصفح يعيد الطلب إلى R2 مباشرة
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ materialId: string }> },
) {
  const { materialId } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرّح." }, { status: 401 });
  }

  const url = await getPlaybackUrl(
    materialId,
    session.user.id,
    session.user.role,
  );

  if (!url) {
    return NextResponse.json({ error: "غير موجود." }, { status: 404 });
  }

  return NextResponse.redirect(url, {
    status: 302,
    headers: { "cache-control": "private, no-store" },
  });
}
