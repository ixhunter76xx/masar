export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-paper">{title}</h2>
      {description && (
        <p className="mt-1.5 text-sm text-muted">{description}</p>
      )}
    </div>
  );
}
