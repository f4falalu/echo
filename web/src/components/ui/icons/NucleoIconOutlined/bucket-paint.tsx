import React from 'react';
import { iconProps } from './iconProps';

function bucketPaint(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px bucket paint';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2.75,5.5l1.25,9.45c0,.994,2.239,1.8,5,1.8s5-.806,5-1.8l1.25-9.45"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.75c.828,0,1.5-.681,1.5-1.522,0-1.156-.841-1.65-1.5-2.478-.659,.828-1.5,1.322-1.5,2.478,0,.841,.672,1.522,1.5,1.522Z"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,10c1.188,1.344,5.972,4.136,7.771,2.083,1.364-1.557-1.251-3.699-1.771-4.099"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13,3.771c1.375,.413,2.25,1.034,2.25,1.729,0,1.243-2.798,2.25-6.25,2.25s-6.25-1.007-6.25-2.25c0-.695,.875-1.316,2.25-1.729"
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

export default bucketPaint;
