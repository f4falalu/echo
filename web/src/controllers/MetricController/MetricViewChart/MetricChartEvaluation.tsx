import { IBusterMetric } from '@/context/Metrics';
import { createStyles } from 'antd-style';
import React, { useMemo } from 'react';
import { AppMaterialIcons } from '@/components/icons';
import { AppPopover } from '@/components/ui/tooltip';

export const MetricChartEvaluation: React.FC<{
  evaluationScore: IBusterMetric['evaluation_score'];
  evaluationSummary: string;
}> = React.memo(({ evaluationScore, evaluationSummary }) => {
  const { styles, cx } = useStyles();

  const text = useMemo(() => {
    if (evaluationScore === 'High') return 'High confidence';
    if (evaluationScore === 'Moderate') return 'Moderate confidence';
    if (evaluationScore === 'Low') return 'Low confidence';
    return 'No confidence';
  }, [evaluationScore]);

  const icon = useMemo(() => {
    if (evaluationScore === 'High') return <AppMaterialIcons icon="check_circle" />;
    if (evaluationScore === 'Moderate') return <AppMaterialIcons icon="warning" />;
    if (evaluationScore === 'Low') return <AppMaterialIcons icon="report" />;
    return <AppMaterialIcons icon="check_circle" />;
  }, [evaluationScore]);

  const colorClass = useMemo(() => {
    if (evaluationScore === 'Low') return 'bg-red-100 text-red-500';
    if (evaluationScore === 'High') return 'bg-lime-100 text-lime-700';
    if (evaluationScore === 'Moderate') return 'bg-[#FFFBE6] text-amber-500';
    return 'bg-gray-100 text-gray-500';
  }, [evaluationScore]);

  return (
    <div className={cx('flex w-full cursor-pointer justify-end')}>
      <AppPopover
        placement="topRight"
        trigger="hover"
        content={<div className="max-w-[250px] p-2">{evaluationSummary}</div>}>
        <div
          className={cx(
            styles.container,
            colorClass,
            'flex items-center gap-1 rounded-lg px-2 py-1 hover:shadow-xs'
          )}>
          {icon}
          {text}
        </div>
      </AppPopover>
    </div>
  );
});

MetricChartEvaluation.displayName = 'MetricChartEvaluation';

const useStyles = createStyles(({ css, token }) => ({
  container: css``
}));
