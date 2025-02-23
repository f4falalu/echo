import React from 'react';

import { iconProps } from './iconProps';

function codeCommit(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'code commit';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M17,9.75H1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H17c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <circle cx="9" cy="9" fill={fill} r="4" />
      </g>
    </svg>
  );
}

export default codeCommit;
