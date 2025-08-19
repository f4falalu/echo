import { useMemo } from 'react';
import { useShapeStream } from '../instances';
import { reportShape } from './shapes';
import { reportsQueryKeys } from '@/api/query_keys/reports';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_UPDATE_OPERATIONS } from '../config';
import { create } from 'mutative';

export const useTrackAndUpdateReportChanges = ({ reportId }: { reportId: string }) => {
  const queryClient = useQueryClient();

  const subscribe = !!reportId && reportId !== 'undefined';

  const shape = useMemo(() => reportShape({ reportId }), [reportId]);

  return useShapeStream(
    shape,
    DEFAULT_UPDATE_OPERATIONS,
    (report) => {
      if (report.value) {
        console.log('report', report.value);
        const queryKey = reportsQueryKeys.reportsGetReport(reportId).queryKey;
        queryClient.setQueryData(queryKey, (v) => {
          if (!v) return v;
          const value = report.value;
          return create(v, (draft) => {
            Object.assign(draft, value);
          });
        });
      }
    },
    subscribe
  );
};
