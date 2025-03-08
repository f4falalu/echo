import React from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from '@/components/ui/switch';

export const EditHideYAxis: React.FC<{
  hideYAxis: boolean;
  onUpdateYAxis: (v: boolean) => void;
}> = React.memo(
  ({ hideYAxis, onUpdateYAxis }) => {
    return (
      <LabelAndInput label={'Hide y-axis'}>
        <div className="flex justify-end">
          <Switch defaultChecked={hideYAxis} onCheckedChange={onUpdateYAxis} />
        </div>
      </LabelAndInput>
    );
  },
  () => {
    return true;
  }
);
EditHideYAxis.displayName = 'EditHideYAxis';
