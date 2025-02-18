import React from 'react';

import { iconProps } from './iconProps';

function I12px_sortUp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px sort up';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m9,3.5L7,.833c-.476-.636-1.524-.635-2,0l-2,2.667c-.286.381-.331.883-.118,1.309.213.426.641.691,1.118.691h4c.477,0,.905-.265,1.118-.691.213-.426.168-.927-.118-1.309Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_sortUp;
