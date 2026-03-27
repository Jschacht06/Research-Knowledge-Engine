import { Settings } from 'lucide-react'
import { SectionHeading } from '../components/ui/SectionHeading'

export function SettingsPage() {
  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Settings"
        title="Workspace settings"
      />

      <div className="rounded-[32px] border border-rke-border/80 bg-white p-10 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
        <div className="grid gap-4 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-rke-violet-soft text-rke-violet">
            <Settings size={28} />
          </div>
          <h2 className="text-2xl font-bold text-rke-navy">Settings placeholder</h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-rke-copy">
            Add profile, notification and workspace preferences here when the product logic is ready.
          </p>
        </div>
      </div>
    </section>
  )
}
