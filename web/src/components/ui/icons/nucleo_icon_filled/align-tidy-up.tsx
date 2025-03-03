import React from 'react';

import { iconProps } from './iconProps';

function alignTidyUp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'align tidy up';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="12" width="5" fill={secondaryfill} rx="1.75" ry="1.75" x="6.5" y="3" />
        <rect height="12" width="5" fill={fill} rx="1.75" ry="1.75" y="3" />
        <rect height="12" width="5" fill={fill} rx="1.75" ry="1.75" x="13" y="3" />
      </g>
    </svg>
  );
}

export default alignTidyUp;
