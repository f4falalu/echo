import { SelectItem } from '@/components/ui/select';

export const PERMISSION_USERS_OPTIONS: SelectItem<'true' | 'false'>[] = [
  {
    label: 'Assigned',
    value: 'true'
  },
  {
    label: 'Not Assigned',
    value: 'false'
  }
];
