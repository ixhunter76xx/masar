/**
 * عرض الأسعار.
 *
 * الدينار البحريني ثلاث خانات عشرية (١ د.ب = ١٠٠٠ فلس)، والقاعدة تخزّن
 * الفلس عددًا صحيحًا. التحويل هنا في موضع واحد فلا يتكرّر بقسمة يدوية
 * في كل صفحة — وأي خطأ فيه يظهر في كل مكان دفعةً واحدة لا في مكان واحد.
 */
export const FILS_PER_DINAR = 1000;

export function formatFils(fils: number): string {
  return (fils / FILS_PER_DINAR).toFixed(3);
}

/** أرخص سعر في مجموعة — لعبارة «يبدأ من» */
export function lowestPrice(prices: number[]): number | null {
  return prices.length ? Math.min(...prices) : null;
}

/** مجموع أسعار المنتجات الفردية مطروحًا منه سعر الحزمة */
export function bundleSaving(bundleFils: number, partsFils: number[]): number {
  const parts = partsFils.reduce((sum, value) => sum + value, 0);
  return Math.max(0, parts - bundleFils);
}
