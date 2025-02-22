import React from 'react';
import { iconProps } from './iconProps';

function I12px_caretMinimizeDiagonal(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px caret minimize diagonal';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m5.25,10.896v-3.896c0-.138-.112-.25-.25-.25H1.104c-.223,0-.334.269-.177.427l3.896,3.896c.157.157.427.046.427-.177Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.896,5.25h-3.896c-.138,0-.25-.112-.25-.25V1.104c0-.223.269-.334.427-.177l3.896,3.896c.157.157.046.427-.177.427Z"
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

export default I12px_caretMinimizeDiagonal;
