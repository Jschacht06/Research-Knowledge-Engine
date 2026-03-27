import type { LucideIcon } from 'lucide-react'

type FeatureCardProps = {
  title: string
  description: string
  icon: LucideIcon
  accentClassName: string
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  accentClassName,
}: FeatureCardProps) {
  return (
    <article className="rounded-[30px] border border-rke-border/80 bg-white p-8 shadow-[0_24px_60px_rgba(24,46,75,0.07)]">
      <div className={`grid size-15 place-items-center rounded-2xl ${accentClassName}`}>
        <Icon size={28} />
      </div>
      <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-rke-navy">{title}</h3>
      <p className="mt-4 text-base leading-7 text-rke-copy">{description}</p>
    </article>
  )
}
