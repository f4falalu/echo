import React from 'react';

import { iconProps } from './iconProps';

function folderContent(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'folder content';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M15.75,7.5c-.414,0-.75-.336-.75-.75v-1c0-.689-.561-1.25-1.25-1.25H7.629c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.121c1.516,0,2.75,1.233,2.75,2.75v1c0,.414-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M14.25,5.5h-4.704l-1.32-2.177c-.496-.816-1.396-1.323-2.351-1.323H3.75c-1.517,0-2.75,1.233-2.75,2.75V12.75c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-4.5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default folderContent;
