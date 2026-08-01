/**
 * مشغّل الفيديو.
 *
 * نستخدم عناصر التحكم الأصلية للمتصفح عمدًا: تعطي شريط تقدّم وتحكمًا
 * بالصوت وملء الشاشة، مع دعم كامل للوحة المفاتيح وقارئات الشاشة
 * وطلبات النطاق (seeking) — وهو ما يصعب مضاهاته بمشغّل مخصّص.
 */
export function VideoPlayer({
  src,
  title,
  poster,
}: {
  src: string;
  title: string;
  poster?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-black">
      <video
        src={src}
        poster={poster}
        controls
        preload="none"
        playsInline
        controlsList="nodownload"
        aria-label={title}
        className="block aspect-video w-full"
      >
        <p className="p-4 text-sm text-muted">
          متصفحك لا يدعم تشغيل الفيديو.
        </p>
      </video>
    </div>
  );
}
