"use client";

import * as React from "react";

/**
 * عنوان الرأسية — القطعة الوحيدة فيها التي تتبدّل مع الصفحة.
 *
 * ── لماذا سياق، ولماذا هذا الملف موجود أصلًا ────────────────────────
 * كانت `Topbar` تُصيَّر داخل `AppPage`، أي داخل **الصفحة** لا التخطيط.
 * وكل ما في الصفحة يُستبدَل بـ`loading.tsx` عند التنقّل — فكانت
 * الرأسية كلها تختفي ومعها زرّ الخروج، ويحلّ محلّها هيكلٌ يشبهها ولا
 * يعمل، ثم تعود. ذلك وميضٌ في كل تنقّلة، وزرُّ خروجٍ يغيب لحظة كلّما
 * تنقّل المستخدم.
 *
 * فرُفعت الرأسية إلى التخطيط لتبقى مركّبة أبدًا. وبقي العنوان وحده
 * يحتاج قناةً تصعد من الصفحة إلى الرأسية — وهذه هي.
 *
 * ── ما يبقى على الخادم ──────────────────────────────────────────────
 * `Topbar` نفسها **مكوّن خادم** ولم تتحوّل: `SignOutButton` يستورد
 * `signOut` من `@/auth`، فلا يجوز أن يستوردها مكوّن عميل. العميلُ هنا
 * نصُّ العنوان وحده — أصغر سطحٍ ممكن.
 *
 * ── الأثر المقصود عند التنقّل ───────────────────────────────────────
 * أثناء التحميل يبقى عنوان الصفحة السابقة ظاهرًا حتى تُعلن الصفحة
 * الجديدة عنوانها. وهذا هو السلوك المطلوب لا نقصٌ فيه: الرأسية مرساة،
 * وإفراغها ثم ملؤها هو الوميض الذي جئنا نزيله.
 */

type TitleStore = {
  title: string;
  setTitle: (next: string) => void;
};

const TopbarTitleContext = React.createContext<TitleStore>({
  title: "",
  setTitle: () => {},
});

export function TopbarTitleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [title, setTitle] = React.useState("");
  const value = React.useMemo(() => ({ title, setTitle }), [title]);

  return (
    <TopbarTitleContext.Provider value={value}>
      {children}
    </TopbarTitleContext.Provider>
  );
}

/**
 * `useLayoutEffect` على العميل و`useEffect` على الخادم.
 *
 * الفارق ليس تجميلًا: `useLayoutEffect` يعمل **قبل الرسم**، فعند
 * التنقّل يُكتب العنوان الجديد في الإطار نفسه الذي يُرسم فيه المحتوى
 * الجديد. و`useEffect` كان سيرسم إطارًا بالعنوان القديم فوق المحتوى
 * الجديد — أي وميضٌ أصغر مكان الوميض الذي أزلناه.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** تُصيَّرها كل صفحة لتُعلن عنوانها للرأسية. لا تَرسم شيئًا. */
export function SetTopbarTitle({ title }: { title: string }) {
  const { setTitle } = React.useContext(TopbarTitleContext);

  useIsomorphicLayoutEffect(() => {
    setTitle(title);
  }, [title, setTitle]);

  return null;
}

/** نصّ العنوان داخل الرأسية الثابتة. */
export function TopbarTitleText({ className }: { className?: string }) {
  const { title } = React.useContext(TopbarTitleContext);

  /* `aria-live="polite"` لأن العنوان يتبدّل دون إعادة تركيب الرأسية،
     فقارئ الشاشة لا يُعلمه شيءٌ آخر أن الصفحة تغيّرت. */
  return (
    <h1 className={className} aria-live="polite">
      {title}
    </h1>
  );
}
