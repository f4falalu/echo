import React from 'react';
import { iconProps } from './iconProps';

function squareCaretUp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px square caret up';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <path
          d="M8.379,6.843l-2.022,2.987c-.337,.498,.02,1.17,.621,1.17h4.044c.601,0,.958-.672,.621-1.17l-2.022-2.987c-.297-.439-.945-.439-1.242,0Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default squareCaretUp;
