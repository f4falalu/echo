import React from 'react';

import { iconProps } from './iconProps';

function users5(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'users 5';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="12.5" cy="4" fill={fill} r="3" />
        <circle cx="5" cy="7.5" fill={secondaryfill} r="2.5" />
        <path
          d="M12.5,8c-1.833,0-3.407,1.104-4.108,2.68,1.281,1.008,2.108,2.568,2.108,4.32v.25c0,.645-.194,1.244-.52,1.75h5.27c.965,0,1.75-.785,1.75-1.75v-2.75c0-2.481-2.019-4.5-4.5-4.5Z"
          fill={fill}
        />
        <path
          d="M5,11c-2.206,0-4,1.794-4,4v.25c0,.965,.785,1.75,1.75,1.75H7.25c.965,0,1.75-.785,1.75-1.75v-.25c0-2.206-1.794-4-4-4Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default users5;
