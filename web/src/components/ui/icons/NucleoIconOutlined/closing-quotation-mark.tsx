import React from 'react';
import { iconProps } from './iconProps';

function closingQuotationMark(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px closing quotation mark';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16.25,8.75h-4.5c-.552,0-1-.448-1-1v-3c0-.552,.448-1,1-1h3.5c.552,0,1,.448,1,1v4c0,3.75-1.25,5.625-3.5,6.5"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,8.75H2.75c-.552,0-1-.448-1-1v-3c0-.552,.448-1,1-1h3.5c.552,0,1,.448,1,1v4c0,3.75-1.25,5.625-3.5,6.5"
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

export default closingQuotationMark;
