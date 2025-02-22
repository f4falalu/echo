import React from 'react';

import { iconProps } from './iconProps';

function openInBrowser(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'open in browser';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75h2.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25V7H15.5v5.25c0,.689-.561,1.25-1.25,1.25h-2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill={fill}
        />
        <path
          d="M11.5,12c.192,0,.384-.073,.53-.22,.293-.293,.293-.768,0-1.061l-2.5-2.5c-.293-.293-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l1.22-1.22v6.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-6.689l1.22,1.22c.146,.146,.338,.22,.53,.22Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default openInBrowser;
