"use client";

import * as React from "react";

/**
 * تسجيل عامل الخدمة.
 *
 * يُسجَّل بعد اكتمال التحميل لا أثناءه: التسجيل يفتح اتصالًا ويُنزّل
 * الملف، وتقديمه على أول رسم يؤخّر ظهور الصفحة بلا مقابل.
 *
 * في التطوير لا يُسجَّل: عامل خدمة عالق يُربك إعادة التحميل السريع
 * ويجعلك تطارد أخطاءً ليست في الشيفرة.
 */
export function ServiceWorker() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // التثبيت ميزة إضافية — فشلها لا يمسّ عمل المنصة
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
