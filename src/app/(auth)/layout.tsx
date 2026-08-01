/** تخطيط شاشات المصادقة — توسيط رأسي وأفقي على الخلفية الأساسية */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-dvh flex items-center justify-center px-4 py-10">
      {/* توهّج خفيف جدًا خلف البطاقة — بلا ظلال ملوّنة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
      >
        <div className="size-[720px] rounded-full bg-accent-deep/[0.07] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[400px]">{children}</div>
    </main>
  );
}
