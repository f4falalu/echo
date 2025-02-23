import React from 'react';
import { iconProps } from './iconProps';

function arrowBoldUp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px arrow bold up';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.391,8.448L9.398,1.867c-.2-.264-.597-.264-.797,0L3.609,8.448c-.25,.329-.015,.802,.398,.802h2.743v6c0,.552,.448,1,1,1h2.5c.552,0,1-.448,1-1v-6h2.743c.413,0,.648-.473,.398-.802Z"
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

export default arrowBoldUp;
