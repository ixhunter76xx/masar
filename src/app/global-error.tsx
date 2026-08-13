"use client";

/**
 * ملاذ أخير: يُستدعى إذا فشل التخطيط الجذر نفسه.
 * يجب أن يحمل `<html>` و`<body>` لأنه يحلّ محل الشجرة كاملة، ولا
 * يمكنه الاعتماد على أنماط التطبيق فقد تكون هي سبب الفشل.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#1a1817",
          color: "#f4f1ec",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, margin: 0 }}>تعذّر تحميل المنصة</h1>
          <p style={{ color: "#b5aca2", fontSize: 13, marginTop: 8 }}>
            حدث خطأ جذري. أعد تحميل الصفحة، وإن تكرر تواصل مع الدعم الفني.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              height: 44,
              padding: "0 20px",
              borderRadius: 10,
              border: 0,
              background: "#e8e2d6",
              color: "#1a1817",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
