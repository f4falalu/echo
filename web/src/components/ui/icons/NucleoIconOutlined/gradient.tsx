import React from 'react';
import { iconProps } from './iconProps';

function gradient(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px gradient';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M6,6V3.75H2.75c-.552,0-1,.448-1,1v2.5c0,.552,.448,1,1,1h5.25v-2.25h-2Z"
          fill={fill}
        />
        <path
          d="M.75,12.75l1.75-2,1.75,2v1.5c0,.552-.448,1-1,1H1.75c-.552,0-1-.448-1-1v-1.5Z"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75,12.75l1.75-2,1.75,2v1.5c0,.552-.448,1-1,1h-1.5c-.552,0-1-.448-1-1v-1.5Z"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M8 3.75H10V6H8z" fill={fill} />
        <path d="M10 6H12V8.25H10z" fill={fill} />
        <rect
          height="4.5"
          width="14.5"
          fill="none"
          rx="1"
          ry="1"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="3.75"
        />
      </g>
    </svg>
  );
}

export default gradient;
