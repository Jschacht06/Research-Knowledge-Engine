import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  title: string
  value: string
  detail: string
  icon: LucideIcon
  accentClassName: string
}

export function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  accentClassName,
}: StatCardProps) {
  return (
    <article className="relative overflow-hidden rounded-[28px] border border-rke-border/80 bg-white p-6 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
      <div className={`absolute right-5 top-5 rounded-2xl p-3 ${accentClassName}`}>
        <Icon size={20} />
      </div>
      <p className="text-sm font-semibold text-rke-copy">{title}</p>
      <strong className="mt-4 block text-4xl font-extrabold tracking-tight text-rke-navy">
        {value}
      </strong>
      <p className="mt-2 text-sm text-rke-copy">{detail}</p>
    </article>
  )
}
