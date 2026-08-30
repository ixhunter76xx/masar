import type { MaterialKind, MaterialStatus } from "@/generated/prisma/enums";

/**
 * شكل عناصر المسار وتجميعها في فصول.
 *
 * ── ⚠ لماذا هنا لا في `lib/data/materials.ts` ───────────────────────
 * ذلك الملفّ يبدأ بـ`import "server-only"`، وهو حارسٌ مقصود: يمنع أي
 * استعلام قاعدة من التسرّب إلى حزمة المتصفّح. و`MaterialList` مكوّن
 * **عميل** يحتاج التجميع نفسه — فاستيراده منه كان سيُسقط البناء.
 *
 * والتجميع ليس استعلامًا أصلًا: دالّة صرفة على مصفوفةٍ في الذاكرة.
 * فموضعها الصحيح وحدةٌ محايدة يقرؤها الطرفان، لا نسخةٌ في كلٍّ منهما.
 */

/** عنصر واحد على المسار — محاضرة أو ملفّ */
export type MaterialListItem = {
  id: string;
  title: string;
  description: string | null;
  kind: MaterialKind;
  status: MaterialStatus;
  sizeBytes: number | null;
  durationSec: number | null;
  isPublished: boolean;
  createdAt: Date;
  /** الفصل الذي ينتمي إليه — `null` يعني خارج الفصول */
  chapter: { id: string; title: string; position: number } | null;
};

/** فصلٌ في المسار ومعه عناصره بترتيبها */
export type MaterialChapter = {
  id: string | null;
  title: string | null;
  items: MaterialListItem[];
};

/**
 * يجمع عناصر المسار في فصولها.
 *
 * ── لماذا التجميع هنا لا في الاستعلام ───────────────────────────────
 * الترتيب المطلوب مركّب: الفصول بترتيبها، والعناصر بترتيبها داخل كل
 * فصل، و**ما لا فصل له أوّلًا**. وترتيب `NULL` عبر علاقةٍ في SQL يحتاج
 * `nulls first` على عمودٍ مشتقّ — استعلامٌ أعقد ممّا يوفّره. والقائمة
 * عشراتُ صفوفٍ لا آلاف، فالفرز في الذاكرة أرخص وأوضح.
 *
 * ── ولماذا «بلا فصل» أوّلًا ─────────────────────────────────────────
 * كل مادة أُنشئت قبل الفصول تحمل `chapterId = null`. فوضعُها أوّلًا
 * يعني أن مقرَّرًا لم تُنشأ له فصول **يُعرض كما كان حرفًا بحرف**:
 * قائمةٌ واحدة بلا عناوين. الميزة تُضاف ولا تُغيّر ما قبلها.
 */
export function groupIntoChapters(items: MaterialListItem[]): MaterialChapter[] {
  const loose: MaterialListItem[] = [];
  const byChapter = new Map<string, MaterialChapter & { position: number }>();

  for (const item of items) {
    if (!item.chapter) {
      loose.push(item);
      continue;
    }
    const found = byChapter.get(item.chapter.id);
    if (found) found.items.push(item);
    else
      byChapter.set(item.chapter.id, {
        id: item.chapter.id,
        title: item.chapter.title,
        position: item.chapter.position,
        items: [item],
      });
  }

  const chapters = [...byChapter.values()]
    .sort((a, b) => a.position - b.position)
    .map(({ id, title, items: list }) => ({ id, title, items: list }));

  return loose.length > 0
    ? [{ id: null, title: null, items: loose }, ...chapters]
    : chapters;
}
