import React from 'react';

import { iconProps } from './iconProps';

function mediaLibrary(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'media library';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.25,2H6.75c-1.517,0-2.75,1.233-2.75,2.75v5.5c0,1.517,1.233,2.75,2.75,2.75h7.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-2.039,6.017l-2.296,1.385c-.402,.242-.915-.047-.915-.517v-2.771c0-.469,.513-.759,.915-.517l2.296,1.385c.389,.235,.389,.799,0,1.033Z"
          fill={fill}
        />
        <path
          d="M12.25,16H3.75c-1.517,0-2.75-1.233-2.75-2.75V6.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.689,.561,1.25,1.25,1.25H12.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default mediaLibrary;
