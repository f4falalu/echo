import React from 'react';

import { iconProps } from './iconProps';

function measure(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'measure';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M15.25,7h-5.25v-1.25c0-1.568-1.935-2.75-4.5-2.75S1,4.182,1,5.75v6.5c0,1.568,1.935,2.75,4.5,2.75v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25h2v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25h2v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25h1.25c.965,0,1.75-.785,1.75-1.75v-4.5c0-.965-.785-1.75-1.75-1.75Zm-9.75,0c-1.804,0-3-.752-3-1.25s1.196-1.25,3-1.25,3,.752,3,1.25-1.196,1.25-3,1.25Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default measure;
