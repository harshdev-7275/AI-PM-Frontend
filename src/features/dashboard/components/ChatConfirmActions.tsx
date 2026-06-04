import { Check, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

// Usage: rendered under the latest assistant message when the AI is awaiting a
// yes/no confirmation for a write action (chat status 'awaiting_confirmation').
// Presentational only — the page owns sending the 'yes' / 'no' reply.
interface ChatConfirmActionsProps {
  onConfirm: () => void
  onCancel: () => void
  disabled?: boolean
}

export function ChatConfirmActions({
  onConfirm,
  onCancel,
  disabled = false,
}: ChatConfirmActionsProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Confirm pending action">
      <Button
        size="sm"
        onClick={onConfirm}
        disabled={disabled}
        className="bg-brand-primary hover:bg-brand-primary/90"
      >
        <Check size={14} />
        Yes, confirm
      </Button>
      <Button size="sm" variant="outline" onClick={onCancel} disabled={disabled}>
        <X size={14} />
        No
      </Button>
    </div>
  )
}
