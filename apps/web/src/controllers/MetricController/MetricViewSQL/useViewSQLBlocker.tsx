import type { BusterMetric } from '@/api/asset_interfaces';
import { useBlockerWithModal } from '@/context/Routes/useBlockerWithModal';

export const useViewSQLBlocker = ({
  sql,
  originalSql,
  enabled,
  onResetToOriginal,
}: {
  sql: string;
  originalSql: BusterMetric['sql'] | undefined;
  enabled: boolean;
  onResetToOriginal: () => void | Promise<void>;
}) => {
  return useBlockerWithModal({
    onReset: onResetToOriginal,
    enableBlocker: enabled && sql !== originalSql,
    title: 'Unsaved changes',
    content: `Looks like you have unsaved changes. Are you sure you want to leave?`,
  });
};
