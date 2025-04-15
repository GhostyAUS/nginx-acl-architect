
import { FC } from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'warning' | 'error';
  label?: string;
  className?: string;
}

const StatusBadge: FC<StatusBadgeProps> = ({ status, label, className }) => {
  const statusConfig = {
    active: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-500',
      ring: 'ring-green-600/20 dark:ring-green-500/20',
      dot: 'bg-green-500',
      defaultLabel: 'Allowed'
    },
    inactive: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-400',
      ring: 'ring-gray-600/20 dark:ring-gray-500/20',
      dot: 'bg-gray-500',
      defaultLabel: 'Inactive'
    },
    warning: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-500',
      ring: 'ring-yellow-600/20 dark:ring-yellow-500/20',
      dot: 'bg-yellow-500',
      defaultLabel: 'Warning'
    },
    error: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-500',
      ring: 'ring-red-600/20 dark:ring-red-500/20',
      dot: 'bg-red-500',
      defaultLabel: 'Blocked'
    }
  };

  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset',
        config.bg,
        config.text,
        config.ring,
        className
      )}
    >
      <span className={cn('mr-1 h-1.5 w-1.5 rounded-full', config.dot)} />
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
