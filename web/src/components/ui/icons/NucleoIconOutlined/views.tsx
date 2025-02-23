import React from 'react';
import { iconProps } from './iconProps';

function views(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px views';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect
          height="10.5"
          width="13.5"
          fill="none"
          rx="2"
          ry="2"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.25"
          y="2.75"
        />
        <path
          d="M4.75 16.25L13.25 16.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.691,7.108c-.54-.694-1.736-1.858-3.691-1.858s-3.151,1.164-3.691,1.859c-.413,.533-.413,1.249,0,1.782,0,0,0,0,0,0,.54,.694,1.736,1.858,3.691,1.858s3.151-1.164,3.691-1.859c.413-.533,.413-1.249,0-1.783Zm-3.691,2.392c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5,.672,1.5,1.5-.672,1.5-1.5,1.5Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default views;
