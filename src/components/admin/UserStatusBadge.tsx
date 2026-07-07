import { Badge } from '@/components/ui/badge'
import { USER_STATUS_LABELS, type UserStatus } from '@/lib/validations'

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge variant={status === 'active' ? 'default' : 'destructive'}>
      {USER_STATUS_LABELS[status]}
    </Badge>
  )
}
