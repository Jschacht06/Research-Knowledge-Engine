import { BookOpen, FileText, Upload } from 'lucide-react'
import { DocumentCard } from '../components/ui/DocumentCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { StatCard } from '../components/ui/StatCard'
import { documents } from '../data/documents'

const stats = [
  {
    title: 'Total Uploads',
    value: '24',
    detail: '+3 this month',
    icon: Upload,
    accentClassName: 'bg-rke-teal-soft text-rke-teal',
  },
  {
    title: 'My Documents',
    value: '18',
    detail: 'Across 5 topics',
    icon: FileText,
    accentClassName: 'bg-rke-amber-soft text-rke-amber',
  },
  {
    title: 'Research Topics',
    value: '5',
    detail: 'Active categories',
    icon: BookOpen,
    accentClassName: 'bg-rke-violet-soft text-rke-violet',
  },
]

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(120deg,#1f376d_10%,#159d93_100%)] px-7 py-8 text-white shadow-[0_28px_80px_rgba(24,46,75,0.22)] md:px-10 md:py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
          Dashboard
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
          Welcome back, Dr. Jane Doe
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-100">
          Wednesday, March 18, 2026.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="space-y-6">
        <SectionHeading
          action={
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-rke-teal px-4 py-3 text-sm font-semibold text-rke-teal transition hover:bg-rke-teal hover:text-white"
              type="button"
            >
              View all
            </button>
          }
          description="Some of the newest documents here for you."
          eyebrow="Recent Activity"
          title="Recent documents"
        />

        <div className="grid gap-5 xl:grid-cols-3">
          {documents.slice(0, 3).map((document) => (
            <DocumentCard key={document.title} document={document} />
          ))}
        </div>
      </section>

      <button
        className="fixed bottom-6 right-6 grid size-16 place-items-center rounded-full bg-rke-amber text-3xl text-white shadow-[0_18px_35px_rgba(245,162,6,0.35)] transition hover:-translate-y-0.5"
        type="button"
      >
        +
      </button>
    </div>
  )
}
