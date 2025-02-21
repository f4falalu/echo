import React from 'react';
import { iconProps } from './iconProps';

function paragraph(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px paragraph';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M11.067,3.317c0-1.141-.925-2.067-2.067-2.067s-2.067,.925-2.067,2.067,.517,1.55,2.067,2.583c1.359,.906,3.1,2.067,3.1,3.617,0,1.712-1.388,2.583-3.1,2.583"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.933,14.683c0,1.141,.925,2.067,2.067,2.067s2.067-.925,2.067-2.067-.707-1.677-2.067-2.583c-1.55-1.033-3.1-2.067-3.1-3.617,0-1.712,1.388-2.583,3.1-2.583"
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

export default paragraph;
