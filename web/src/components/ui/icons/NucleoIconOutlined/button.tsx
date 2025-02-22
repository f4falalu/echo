import React from 'react';
import { iconProps } from './iconProps';

function button(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px button';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16.25,8.917v-3.167c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v3.5c0,1.104,.895,2,2,2h3.681"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.934,9.27l6.854,2.504c.289,.106,.28,.517-.012,.611l-3.137,1.004-1.004,3.137c-.094,.293-.505,.301-.611,.012l-2.504-6.854c-.094-.258,.156-.508,.414-.414Z"
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

export default button;
