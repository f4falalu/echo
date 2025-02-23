import React from 'react';
import { iconProps } from './iconProps';

function caretMinimizeDiagonal2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px caret minimize diagonal 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2.854,7.75H7.5c.138,0,.25-.112,.25-.25V2.854c0-.223-.269-.334-.427-.177L2.677,7.323c-.157,.157-.046,.427,.177,.427Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.146,10.25h-4.646c-.138,0-.25,.112-.25,.25v4.646c0,.223,.269,.334,.427,.177l4.646-4.646c.157-.157,.046-.427-.177-.427Z"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default caretMinimizeDiagonal2;
