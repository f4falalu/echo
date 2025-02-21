import React from 'react';

import { iconProps } from './iconProps';

function I12px_heart2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px heart 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.844,1.902c-.854-.749-1.965-1.05-3.053-.832-.694.14-1.312.476-1.793.96-.64-.641-1.486-1.005-2.394-1.028-.932-.011-1.83.318-2.51.965C.414,2.613.025,3.485,0,4.423c-.024.938.319,1.83.968,2.514l3.968,4.123c.276.287.664.452,1.062.452s.786-.165,1.062-.452l3.968-4.123s.002-.002.003-.003c.848-.893,1.163-2.149.845-3.362-.167-.638-.535-1.231-1.035-1.67Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_heart2;
