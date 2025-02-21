import React from 'react';
import { iconProps } from './iconProps';

function panorama(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px panorama';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16.25,13.294c0,.687-.669,1.168-1.32,.945-1.468-.504-3.501-.993-5.942-.991-2.43,.002-4.455,.489-5.918,.991-.65,.223-1.32-.257-1.32-.945V4.706c0-.687,.67-1.168,1.32-.945,1.464,.503,3.488,.99,5.918,.991,2.441,.002,4.474-.487,5.942-.991,.65-.223,1.32,.257,1.32,.945V13.294Z"
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

export default panorama;
