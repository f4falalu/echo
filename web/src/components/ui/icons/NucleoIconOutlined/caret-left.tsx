import React from 'react';
import { iconProps } from './iconProps';

function caretLeft(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px caret left';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M3.791,9.845l7.923,5.025c.666,.422,1.536-.056,1.536-.845V3.975c0-.788-.87-1.267-1.536-.845L3.791,8.155c-.619,.393-.619,1.296,0,1.689Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default caretLeft;
