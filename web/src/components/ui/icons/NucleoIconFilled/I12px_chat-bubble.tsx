import React from 'react';

import { iconProps } from './iconProps';

function I12px_chatBubble(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px chat bubble';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m8.75.501H3.25C1.733.501.5,1.735.5,3.251v8c0,.297.175.566.447.686.097.043.201.064.303.064.183,0,.364-.067.504-.195l2.536-2.305h4.46c1.517,0,2.75-1.233,2.75-2.75v-3.5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_chatBubble;
