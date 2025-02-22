import React from 'react';

import { iconProps } from './iconProps';

function I12px_caretDown(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px caret down';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m9.099,2.5H2.901c-.554,0-1.061.303-1.322.792-.262.488-.233,1.079.074,1.54l3.099,4.648c.279.418.745.668,1.248.668s.969-.25,1.248-.668l3.099-4.648c.308-.461.336-1.051.074-1.54-.262-.489-.769-.792-1.322-.792Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_caretDown;
