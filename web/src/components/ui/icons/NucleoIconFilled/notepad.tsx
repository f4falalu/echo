import React from 'react';

import { iconProps } from './iconProps';

function notepad(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'notepad';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.25,2h-.25v-.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.75h-1.75v-.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.75h-1.75v-.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.75h-.25c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-.75,7.25c0,.414-.336,.75-.75,.75H6.25c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75h5.5c.414,0,.75,.336,.75,.75v2.5Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default notepad;
