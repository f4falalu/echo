import React from 'react';

import { iconProps } from './iconProps';

function conferenceRoom(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'conference room';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="15" width="8" fill={fill} rx="1.75" ry="1.75" x="5" y="1.5" />
        <circle cx="2.25" cy="9" fill={secondaryfill} r="1.25" />
        <circle cx="2.25" cy="4.25" fill={secondaryfill} r="1.25" />
        <circle cx="2.25" cy="13.75" fill={secondaryfill} r="1.25" />
        <circle cx="15.75" cy="9" fill={secondaryfill} r="1.25" />
        <circle cx="15.75" cy="4.25" fill={secondaryfill} r="1.25" />
        <circle cx="15.75" cy="13.75" fill={secondaryfill} r="1.25" />
      </g>
    </svg>
  );
}

export default conferenceRoom;
