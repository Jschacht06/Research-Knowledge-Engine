import type { ReactNode } from 'react'

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rke-teal">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-rke-navy md:text-4xl">
          {title}
        </h2>
        {description && <p className="mt-3 text-base leading-7 text-rke-copy">{description}</p>}
      </div>
      {action}
    </div>
  )
}
