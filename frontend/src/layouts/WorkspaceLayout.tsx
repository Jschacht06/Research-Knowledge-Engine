import { Outlet } from 'react-router-dom'
import { WorkspaceSearchBar } from '../components/workspace/WorkspaceSearchBar'
import { WorkspaceSidebar } from '../components/workspace/WorkspaceSidebar'

export function WorkspaceLayout() {
  return (
    <div className="min-h-screen bg-rke-surface lg:grid lg:grid-cols-[296px_minmax(0,1fr)]">
      <WorkspaceSidebar />

      <div className="min-w-0">
        <WorkspaceSearchBar />
        <main className="px-5 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
