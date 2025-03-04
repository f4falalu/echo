import type { IBusterMetric } from '@/context/Metrics';
import React, { useMemo } from 'react';
import { CircleCheck, CircleWarning, CircleDotted } from '@/components/ui/icons';
import { Popover } from '@/components/ui/tooltip/Popover';
import { Button, type ButtonProps } from '@/components/ui/buttons';

export const MetricChartEvaluation: React.FC<{
  evaluationScore: IBusterMetric['evaluation_score'];
  evaluationSummary: string;
}> = React.memo(({ evaluationScore, evaluationSummary }) => {
  const text = useMemo(() => {
    if (evaluationScore === 'High') return 'High confidence';
    if (evaluationScore === 'Moderate') return 'Moderate confidence';
    if (evaluationScore === 'Low') return 'Low confidence';
    return 'No confidence';
  }, [evaluationScore]);

  const icon = useMemo(() => {
    if (evaluationScore === 'High') return <CircleCheck />;
    if (evaluationScore === 'Moderate') return <CircleDotted />;
    if (evaluationScore === 'Low') return <CircleWarning />;
    return <CircleCheck />;
  }, [evaluationScore]);

  const variant: ButtonProps['variant'] = useMemo(() => {
    if (evaluationScore === 'High') return 'success';
    if (evaluationScore === 'Moderate') return 'warning';
    if (evaluationScore === 'Low') return 'danger';

    return 'default';
  }, [evaluationScore]);

  return (
    <Popover
      side="top"
      align="end"
      content={<div className="leading-1.3 max-w-[250px]">{evaluationSummary}</div>}>
      <Button variant={variant} prefix={icon}>
        {text}
      </Button>
    </Popover>
  );
});

MetricChartEvaluation.displayName = 'MetricChartEvaluation';
