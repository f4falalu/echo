import React from 'react';
import { iconProps } from './iconProps';

function I12px_paperPlane2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px paper plane 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10.961 1.039L4.82 7.18"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m11.21,1.8l-2.859,8.893c-.213.661-1.108.759-1.457.159l-2.01-3.447c-.07-.12-.169-.219-.289-.289l-3.447-2.01c-.6-.35-.502-1.245.159-1.457L10.2.79c.622-.2,1.21.388,1.01,1.01Z"
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

export default I12px_paperPlane2;
