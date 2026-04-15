import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="text-5xl opacity-30">{icon}</div>
      <div className="space-y-1.5">
        <p className="text-[#e2e2ea] font-semibold text-lg">{title}</p>
        {description && (
          <p className="text-[#6b6b80] text-sm max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
