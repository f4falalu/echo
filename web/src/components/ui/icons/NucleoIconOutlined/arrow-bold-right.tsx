import React from 'react';
import { iconProps } from './iconProps';

function arrowBoldRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px arrow bold right';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9.552,14.391l6.581-4.993c.264-.2,.264-.597,0-.797L9.552,3.609c-.329-.25-.802-.015-.802,.398v2.743H2.75c-.552,0-1,.448-1,1v2.5c0,.552,.448,1,1,1h6v2.743c0,.413,.473,.648,.802,.398Z"
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

export default arrowBoldRight;
