import React from 'react';

import { iconProps } from './iconProps';

function notebook(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'notebook';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M17.25,8c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M12.75,1H5.25c-1.517,0-2.75,1.233-2.75,2.75v1.25h-.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75v1.75h-.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75v1.75h-.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75v1.25c0,1.517,1.233,2.75,2.75,2.75h7.5c1.517,0,2.75-1.233,2.75-2.75V3.75c0-1.517-1.233-2.75-2.75-2.75ZM4,14.25v-1.25h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.75v-1.75h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.75v-1.75h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.75v-1.25c0-.689,.561-1.25,1.25-1.25h1.75V15.5h-1.75c-.689,0-1.25-.561-1.25-1.25Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default notebook;
