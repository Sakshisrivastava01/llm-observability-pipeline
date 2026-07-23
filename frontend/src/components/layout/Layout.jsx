import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { PageTransition } from './PageTransition'
import { AuthRequiredModal } from '@/components/shared/AuthRequiredModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Layout({ children, title, subtitle, showFilters }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-surface-900 bg-noise">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} showFilters={showFilters} />
        <main className="flex-1 overflow-y-auto p-6">
          <PageTransition>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </PageTransition>
        </main>
      </div>
      <AuthRequiredModal />
    </div>
  )
}
