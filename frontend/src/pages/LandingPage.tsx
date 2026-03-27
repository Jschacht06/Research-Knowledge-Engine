import {
  BookOpen,
  FileText,
  FolderTree,
  Grid2x2,
  Search,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { FeatureCard } from '../components/landing/FeatureCard'
import { AppLogo } from '../components/ui/AppLogo'
import { SectionHeading } from '../components/ui/SectionHeading'

const featureCards = [
  {
    title: 'Upload proposals',
    description:
      'Capture research proposals and supporting documents with structured metadata instead of loose files and folders.',
    icon: Upload,
    accentClassName: 'bg-rke-teal-soft text-rke-teal',
  },
  {
    title: 'Organize by topic',
    description:
      'Keep robotics, AI, sensors and control work discoverable through clear taxonomy and shared structure.',
    icon: FolderTree,
    accentClassName: 'bg-rke-amber-soft text-rke-amber',
  },
  {
    title: 'Discover related work',
    description:
      'Explore the collective knowledge base with filters, author lookups and reusable document views.',
    icon: Search,
    accentClassName: 'bg-rke-violet-soft text-rke-violet',
  },
]

const steps = [
  {
    index: '1',
    title: 'Upload',
    description: 'Add the proposal, metadata and ownership once so the system can reuse it everywhere.',
    icon: Upload,
    accentClassName: 'bg-rke-teal-soft text-rke-teal',
  },
  {
    index: '2',
    title: 'Organize',
    description: 'Documents become easier to maintain when topics, dates and authors follow one shared model.',
    icon: FolderTree,
    accentClassName: 'bg-rke-amber-soft text-rke-amber',
  },
  {
    index: '3',
    title: 'Discover',
    description: 'Researchers can search and browse past work instead of rebuilding context from scratch.',
    icon: Search,
    accentClassName: 'bg-rke-violet-soft text-rke-violet',
  },
]

const stats = [
  { label: 'Documents', value: '120+', icon: FileText },
  { label: 'Researchers', value: '15', icon: Grid2x2 },
  { label: 'Research topics', value: '8', icon: BookOpen },
]

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-rke-border/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <AppLogo />

          <nav className="flex flex-wrap items-center gap-5 text-sm font-semibold text-rke-copy">
            <Link className="transition hover:text-rke-navy" to="/">
              Home
            </Link>
            <a className="transition hover:text-rke-navy" href="#core-workflow">
              Explore
            </a>
            <a className="transition hover:text-rke-navy" href="#about-rke">
              About
            </a>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-rke-navy transition hover:bg-rke-surface"
              to="/login"
            >
              Login
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-2xl bg-rke-amber px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rke-amber/30 transition hover:-translate-y-0.5"
              to="/register"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16)_0,transparent_34%),linear-gradient(135deg,#1f376d_10%,#21487a_45%,#159d93_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[size:72px_72px]" />

        <div className="relative mx-auto flex min-h-[560px] max-w-7xl flex-col items-center justify-center px-5 py-24 text-center text-white">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/90">
            Research Platform
          </span>
          <h1 className="mt-8 max-w-4xl text-5xl font-extrabold tracking-tight md:text-7xl">
            Your research should feel structured, shared and discoverable.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100">
            A cleaner frontend foundation for the VIVES Mechatronics research group, ready
            for real routing, reusable components and maintainable React workflows.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              className="inline-flex items-center justify-center rounded-2xl bg-rke-amber px-6 py-3.5 font-semibold text-white shadow-lg shadow-rke-amber/30 transition hover:-translate-y-0.5"
              to="/register"
            >
              Get Started
            </Link>
            <a
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 font-semibold text-white transition hover:bg-white/15"
              href="#core-workflow"
            >
              Explore Research
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20" id="core-workflow">
        <SectionHeading
          description="The landing experience is now just one page in a routed app, instead of the whole product living inside one component."
          eyebrow="Core Workflow"
          title="Built around the way research teams actually work"
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="bg-rke-teal">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-center text-white md:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <Icon size={30} />
              <strong className="text-4xl font-extrabold tracking-tight">{value}</strong>
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <SectionHeading
          description="Each major page now lives in its own file, while shared UI stays in reusable components instead of being copied inside one giant render function."
          eyebrow="How It Works"
          title="A product flow that is easier to explain to new React developers"
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {steps.map(({ index, title, description, icon: Icon, accentClassName }) => (
            <article
              key={title}
              className="rounded-[30px] border border-rke-border/80 bg-white p-8 text-center shadow-[0_24px_60px_rgba(24,46,75,0.07)]"
            >
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-rke-amber text-2xl font-extrabold text-white">
                {index}
              </div>
              <div
                className={`mx-auto mt-6 grid size-14 place-items-center rounded-2xl ${accentClassName}`}
              >
                <Icon size={26} />
              </div>
              <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-rke-navy">
                {title}
              </h3>
              <p className="mt-4 text-base leading-7 text-rke-copy">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-rke-border/80 bg-white" id="about-rke">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-[1.8fr_1fr_1fr]">
          <section>
            <AppLogo compact />
            <p className="mt-5 max-w-xl text-sm leading-7 text-rke-copy">
              A shared knowledge base for the VIVES Mechatronics research group to upload,
              organize and discover research proposals with a frontend structure that scales.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-rke-navy">Quick Links</h2>
            <Link className="block text-sm text-rke-copy transition hover:text-rke-navy" to="/">
              Home
            </Link>
            <a
              className="block text-sm text-rke-copy transition hover:text-rke-navy"
              href="#core-workflow"
            >
              Explore
            </a>
            <a className="block text-sm text-rke-copy transition hover:text-rke-navy" href="#about-rke">
              About
            </a>
            <Link className="block text-sm text-rke-copy transition hover:text-rke-navy" to="/login">
              Login
            </Link>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-rke-navy">Contact</h2>
            <p className="text-sm text-rke-copy">VIVES Mechatronics</p>
            <p className="text-sm text-rke-copy">research@vives.be</p>
          </section>
        </div>
      </footer>

      <button
        className="fixed bottom-4 left-4 rounded-xl border border-rke-border bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-lg shadow-slate-900/5"
        type="button"
      >
        Manage cookies or opt out
      </button>
    </div>
  )
}
