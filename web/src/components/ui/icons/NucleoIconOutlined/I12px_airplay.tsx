import React from 'react';
import { iconProps } from './iconProps';

function I12px_airplay(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px airplay';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.445,9.345h0c.486-.365.805-.941.805-1.595V3.25c0-1.105-.895-2-2-2H2.75C1.645,1.25.75,2.145.75,3.25v4.5c0,.655.319,1.23.805,1.595h0"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6.2,7.865l2.249,2.985c.124.165.007.4-.2.4H3.751c-.206,0-.324-.236-.2-.4l2.249-2.985c.1-.133.299-.133.399,0Z"
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

export default I12px_airplay;
