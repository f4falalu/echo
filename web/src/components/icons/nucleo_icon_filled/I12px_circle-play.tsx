import React from 'react';

import { iconProps } from './iconProps';

function I12px_circlePlay(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px circle play';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m6,0C2.691,0,0,2.691,0,6s2.691,6,6,6,6-2.691,6-6S9.309,0,6,0Zm1.724,6.518l-2.308,1.385c-.403.242-.916-.048-.916-.518v-2.771c0-.47.513-.76.916-.518l2.308,1.385c.391.235.391.802,0,1.037Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_circlePlay;
