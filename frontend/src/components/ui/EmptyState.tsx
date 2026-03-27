type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-rke-border bg-white/70 p-10 text-center">
      <h3 className="text-xl font-bold text-rke-navy">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-rke-copy">{description}</p>
    </div>
  )
}
