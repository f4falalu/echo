import React from 'react';

import { iconProps } from './iconProps';

function adjustContrast(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'adjust contrast';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1ZM2.5,9c0-3.33,2.519-6.08,5.75-6.453V15.453c-3.231-.374-5.75-3.123-5.75-6.453Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default adjustContrast;
