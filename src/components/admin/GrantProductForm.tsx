"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { grantProductToStudent } from "@/app/(app)/settings/students/actions";
import { Select } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";

type Option = {
  id: string;
  title: string;
  priceFils: number;
  course: { code: string; title: string };
};

/**
 * منح باقة لطالب يدويًا — منحة أو تعويض.
 *
 * السبب **مطلوب** لا اختياري: المنح يفتح محتوى مدفوعًا بلا مقابل،
 * وسؤال «لماذا فُتح هذا؟» يُطرح بعد شهور لا بعد دقائق. والسبب يُحفظ
 * في `reviewNote` بجانب الطلب فيبقى مقروءًا مع سببه لا بعيدًا عنه.
 */
export function GrantProductForm({
  userId,
  products,
}: {
  userId: string;
  products: Option[];
}) {
  const router = useRouter();
  const [productId, setProductId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDone(false);

    const result = await grantProductToStudent({ userId, productId, reason });
    if (result.ok) {
      setDone(true);
      setProductId("");
      setReason("");
      router.refresh();
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <FormAlert>{error}</FormAlert>}
      {done && <FormAlert tone="success">تم المنح، وسُجّل في الطلبات.</FormAlert>}

      <div>
        <label htmlFor="grant-product" className="mb-1.5 block text-[11px] text-muted">
          الباقة
        </label>
        <Select
          id="grant-product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
        >
          <option value="">— اختر باقة —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.course.code} — {p.title}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="grant-reason" className="mb-1.5 block text-[11px] text-muted">
          سبب المنح
        </label>
        <input
          id="grant-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          placeholder="منحة · تعويض عن عطل · اتفاق خاص"
          className="input-field text-[13px]"
        />
      </div>

      <p className="text-[11px] leading-[1.8] text-subtle">
        يُنشأ طلبٌ بقيمة <span className="numeric">٠</span> ويُؤكَّد فورًا — فيبقى
        المنح مرئيًّا في سجلّ الطلبات مع سببه ومن منحه. لا مال يُسجَّل، لأن لا
        مال قُبض.
      </p>

      <button
        type="submit"
        disabled={busy || !productId || reason.trim().length < 3}
        className="press inline-flex min-h-touch items-center rounded-field bg-action px-5 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "جارٍ المنح…" : "امنح الوصول"}
      </button>
    </form>
  );
}
