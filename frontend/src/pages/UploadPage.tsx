import { Upload } from 'lucide-react'
import { SectionHeading } from '../components/ui/SectionHeading'

export function UploadPage() {
  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Upload"
        title="Document intake"
      />

      <div className="rounded-[32px] border border-dashed border-rke-border bg-white p-10 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
        <div className="grid gap-4 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-rke-teal-soft text-rke-teal">
            <Upload size={28} />
          </div>
          <h2 className="text-2xl font-bold text-rke-navy">Upload flow placeholder</h2>
        </div>
      </div>
    </section>
  )
}
