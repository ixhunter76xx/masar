"use client";

import * as React from "react";
import { ar } from "@/lib/numerals";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Card } from "@/components/ui/Card";
import {
  createProduct,
  deleteProduct,
  setProductPublished,
} from "@/app/(app)/settings/courses/actions";

type Lesson = { id: string; title: string; isFreePreview: boolean };

type Product = {
  id: string;
  slug: string;
  title: string;
  /** بالدينار، منسّقًا — العرض لا يعيد الحساب */
  price: string;
  isPublished: boolean;
  lessonIds: string[];
  /** مرتبطة بطلب أو اشتراك، فلا تُحذف */
  locked: boolean;
};

/**
 * إدارة باقات مقرر واحد.
 *
 * ── لماذا اختيار الدروس بمربّعات لا بعدد ────────────────────────────
 * الباقة ليست «أول درسين» بل مجموعة دروس بعينها، والحزم تتقاطع عمدًا:
 * «الكاملة» تشير إلى نفس دروس «المنتصف» و«النهائي» لا إلى نسخ منها.
 * فاختيار الدروس صراحةً هو النموذج الحقيقي، وأي اختصار رقمي يكذب عليه.
 */
export function ProductManager({
  courseId,
  lessons,
  products,
}: {
  courseId: string;
  lessons: Lesson[];
  products: Product[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [picked, setPicked] = React.useState<string[]>([]);

  function toggle(lessonId: string) {
    setPicked((current) =>
      current.includes(lessonId)
        ? current.filter((id) => id !== lessonId)
        : [...current, lessonId],
    );
  }

  async function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(true);
    setError(null);
    const result = await fn();
    if (result.ok) router.refresh();
    else setError(result.message ?? "تعذّر إتمام العملية.");
    setBusy(false);
    return result.ok;
  }

  async function onCreate() {
    const created = await run(() =>
      createProduct({
        courseId,
        title,
        slug,
        priceDinars: Number(price),
        lessonIds: picked,
      }),
    );

    if (created) {
      setTitle("");
      setSlug("");
      setPrice("");
      setPicked([]);
    }
  }

  return (
    <>
      <Card className="mb-6 px-5 py-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-paper">
          <Plus size={15} strokeWidth={2} aria-hidden="true" />
          باقة جديدة
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="عنوان الباقة" value={title} onChange={setTitle} placeholder="دورة المنتصف" />
          <Field label="المعرّف" value={slug} onChange={setSlug} placeholder="midterm" mono />
          <Field label="السعر (د.ب)" value={price} onChange={setPrice} placeholder="8" mono />
        </div>

        <fieldset className="mt-4 border-t border-line pt-4">
          <legend className="sr-only">دروس الباقة</legend>
          <p className="mb-2.5 text-[11px] text-subtle">
            دروس هذه الباقة — الحزم تتقاطع، فدرسٌ واحد يظهر في أكثر من باقة.
          </p>

          <div className="grid gap-1.5">
            {lessons.map((lesson, index) => (
              <label
                key={lesson.id}
                className="flex min-h-touch cursor-pointer items-center gap-2.5 rounded-[10px]
                  border border-line bg-ink px-3 text-[13px] text-paper
                  transition-colors hover:border-accent-deep"
              >
                <input
                  type="checkbox"
                  checked={picked.includes(lesson.id)}
                  onChange={() => toggle(lesson.id)}
                  disabled={busy}
                  className="size-4 accent-[var(--color-action)]"
                />
                <span className="numeric text-[11px] text-subtle">{ar(index + 1)}</span>
                {lesson.title}
                {lesson.isFreePreview && (
                  <span className="ms-auto rounded-full border border-success/50 px-2 py-0.5 text-[10px] text-success">
                    مجاني
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={onCreate}
          disabled={busy}
          className="press mt-4 inline-flex min-h-touch items-center gap-2 rounded-[10px]
            px-4 text-sm font-medium text-ink
            shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_1px_2px_rgba(0,0,0,0.35)]
            [background:linear-gradient(180deg,var(--color-accent-bright),var(--color-action))]
            disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          إنشاء الباقة
        </button>

        {error && (
          <p role="alert" className="mt-2 text-[11px] text-danger">
            {error}
          </p>
        )}
      </Card>

      <ul className="space-y-2">
        {products.map((product) => (
          <li key={product.id}>
            <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] text-paper">
                  {product.title}
                  <span className="numeric ms-2 text-[11px] text-subtle">
                    {product.slug}
                  </span>
                  {!product.isPublished && (
                    <span className="ms-2 rounded-full border border-warning/40 px-2 py-0.5 text-[10px] text-warning">
                      غير منشورة
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-subtle">
                  <span className="numeric">{ar(product.price)}</span> د.ب ·{" "}
                  <span className="numeric">{ar(product.lessonIds.length)}</span> دروس
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(() => setProductPublished(product.id, !product.isPublished))
                  }
                  className="press inline-flex min-h-touch items-center rounded-[10px]
                    border border-line bg-ink px-3 text-xs text-paper
                    transition-colors hover:border-accent-deep disabled:cursor-not-allowed"
                >
                  {product.isPublished ? "إيقاف البيع" : "نشر"}
                </button>

                {!product.locked && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => deleteProduct(product.id))}
                    className="press inline-flex min-h-touch items-center rounded-[10px]
                      px-3 text-xs text-subtle transition-colors hover:text-danger
                      disabled:cursor-not-allowed"
                  >
                    حذف
                  </button>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  mono?: boolean;
}) {
  const id = `field-${label}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[11px] text-muted">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`input-field text-[13px] ${mono ? "numeric" : ""}`}
      />
    </div>
  );
}
