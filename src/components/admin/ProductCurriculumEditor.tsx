"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  setProductLessons,
  updateProduct,
} from "@/app/(app)/settings/courses/actions";
import { FormAlert } from "@/components/ui/FormAlert";
import { Num } from "@/components/ui/Num";
import { formatFils } from "@/lib/price";
import { arPrice } from "@/lib/numerals";

type Lesson = { id: string; title: string; isFreePreview: boolean };

/**
 * تحرير باقة ومنهجها في مكان واحد.
 *
 * ── لماذا الاثنان معًا لا شاشتان ────────────────────────────────────
 * السعر ومحتوى الباقة قرارٌ واحد: «كم تساوي هذه الدروس؟». فصلُهما يجعل
 * المالك يفتح شاشتين ليتّخذ قرارًا واحدًا، ويخاطر بأن يعدّل السعر وينسى
 * المحتوى.
 */
export function ProductCurriculumEditor({
  product,
  lessons,
}: {
  product: {
    id: string;
    title: string;
    priceFils: number;
    description: string | null;
    lessonIds: string[];
    soldCount: number;
  };
  lessons: Lesson[];
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState(product.title);
  const [dinars, setDinars] = React.useState(String(product.priceFils / 1000));
  const [description, setDescription] = React.useState(product.description ?? "");
  const [picked, setPicked] = React.useState<string[]>(product.lessonIds);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const initial = React.useRef(new Set(product.lessonIds));
  const removed = product.lessonIds.filter((id) => !picked.includes(id));
  const narrowing = product.soldCount > 0 && removed.length > 0;

  function toggle(id: string) {
    setSaved(false);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function save() {
    setBusy(true);
    setError(null);

    const priceResult = await updateProduct({
      productId: product.id,
      title,
      priceDinars: Number(dinars),
      description: description || undefined,
    });
    if (!priceResult.ok) {
      setError(priceResult.message);
      setBusy(false);
      return;
    }

    const lessonResult = await setProductLessons({
      productId: product.id,
      lessonIds: picked,
    });
    if (!lessonResult.ok) {
      setError(lessonResult.message);
      setBusy(false);
      return;
    }

    initial.current = new Set(picked);
    setSaved(true);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <FormAlert>{error}</FormAlert>}
      {saved && <FormAlert tone="success">حُفظت الباقة ومنهجها.</FormAlert>}

      <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <div>
          <label className="mb-1.5 block text-[11px] text-muted" htmlFor={`t-${product.id}`}>
            اسم الباقة
          </label>
          <input
            id={`t-${product.id}`}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
            className="input-field text-[13px]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] text-muted" htmlFor={`p-${product.id}`}>
            السعر (د.ب)
          </label>
          {/* ⚠ الحقل لاتينيّ عمدًا: قيمته تمرّ من `Number()` عند الحفظ،
              وتعريبها يجعلها `NaN`. التعريب عند العرض وحده. */}
          <input
            id={`p-${product.id}`}
            value={dinars}
            inputMode="decimal"
            onChange={(e) => { setDinars(e.target.value); setSaved(false); }}
            className="input-field numeric text-[13px]"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] text-muted" htmlFor={`d-${product.id}`}>
          وصف الباقة
        </label>
        <input
          id={`d-${product.id}`}
          value={description}
          onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
          className="input-field text-[13px]"
        />
      </div>

      {product.soldCount > 0 && (
        <p className="rounded-field border border-line-soft bg-[var(--sunk)] px-3 py-2 text-[11px] leading-[1.8] text-subtle">
          هذه الباقة لها{" "}
          <Num className="text-paper">{product.soldCount}</Num> طلبًا
          سابقًا. تغيير السعر <span className="text-paper">لا يمسّها</span> —
          كل طلب يحفظ سعره واسمه وقت الشراء، فمن اشترى بـ
          <span className="numeric"> {arPrice(formatFils(product.priceFils))}</span> يبقى
          سجلّه كما هو.
        </p>
      )}

      {/* ── المنهج ─────────────────────────────────────────────────── */}
      <fieldset>
        <legend className="mb-2 text-[11px] text-muted">
          دروس الباقة — <Num>{picked.length}</Num> من{" "}
          <Num>{lessons.length}</Num>
        </legend>

        {lessons.length === 0 ? (
          <p className="text-[12px] text-subtle">
            لا دروس في هذا المقرر بعد — أضِف دروسًا أولًا من شاشة المقرر.
          </p>
        ) : (
          <ul className="space-y-1">
            {lessons.map((lesson, index) => (
              <li key={lesson.id}>
                <label className="flex min-h-touch cursor-pointer items-center gap-2.5 rounded-field px-2 hover:bg-panel-lift">
                  <input
                    type="checkbox"
                    checked={picked.includes(lesson.id)}
                    onChange={() => toggle(lesson.id)}
                    className="size-4 accent-[var(--color-action)]"
                  />
                  <Num className="w-5 shrink-0 text-[11px] text-subtle">{index + 1}</Num>
                  <span className="flex-1 truncate text-[13px]">{lesson.title}</span>
                  {lesson.isFreePreview && (
                    <span className="shrink-0 rounded-full border border-spark/45 bg-spark/10 px-2 py-0.5 text-[10px] text-spark">
                      مجاني
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {narrowing && (
        <p className="rounded-field border border-warning/40 bg-warning/5 px-3 py-2 text-[11px] leading-[1.8] text-warning">
          ⚠ تسحب <Num>{removed.length}</Num> درسًا من باقة
          اشتراها <Num>{product.soldCount}</Num> طالبًا.
          من اشتراها سيفقد الوصول إلى هذه الدروس فورًا.
        </p>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="press inline-flex min-h-touch items-center rounded-field bg-action px-5 text-sm font-semibold text-ink disabled:opacity-50"
      >
        {busy ? "جارٍ الحفظ…" : "احفظ الباقة"}
      </button>
    </div>
  );
}
