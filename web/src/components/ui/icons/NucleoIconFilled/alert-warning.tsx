import React from 'react';

import { iconProps } from './iconProps';

function alertWarning(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'alert warning';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,11.5c.414,0,.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V10.75c0,.414,.336,.75,.75,.75Z"
          fill={fill}
        />
        <circle cx="9" cy="15" fill={secondaryfill} r="1" />
      </g>
    </svg>
  );
}

export default alertWarning;
