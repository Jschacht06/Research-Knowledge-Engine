import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

type AppLogoProps = {
  compact?: boolean
  to?: string
}

export function AppLogo({ compact = false, to = '/' }: AppLogoProps) {
  return (
    <Link className="inline-flex items-center gap-3" to={to}>
      <div className="grid size-11 place-items-center rounded-2xl bg-rke-blue text-white shadow-lg shadow-rke-blue/20">
        <FileText size={compact ? 20 : 24} />
      </div>
      <div>
        <p
          className={`font-extrabold tracking-tight text-rke-navy ${compact ? 'text-lg' : 'text-xl md:text-2xl'}`}
        >
          Research Knowledge Engine
        </p>
        {!compact && (
          <p className="text-sm text-rke-copy">
            Shared research workspace for the VIVES Mechatronics group
          </p>
        )}
      </div>
    </Link>
  )
}
