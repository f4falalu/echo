import React from 'react';

import { iconProps } from './iconProps';

function I12px_shield(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px shield';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.536,1.807L6.286.057c-.183-.075-.389-.075-.571,0L1.464,1.807c-.281.116-.464.39-.464.693v4.969c0,2.676,3.479,4.085,4.543,4.453.15.052.304.079.458.079.153,0,.306-.026.453-.078,1.066-.368,4.546-1.778,4.546-4.454V2.5c0-.304-.184-.578-.464-.693Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_shield;
