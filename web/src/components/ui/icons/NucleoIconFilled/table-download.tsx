import React from 'react';

import { iconProps } from './iconProps';

function tableDownload(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'table download';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16.78,13.22c-.293-.293-.768-.293-1.061,0l-1.22,1.22v-3.189c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.189l-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061Z"
          fill={secondaryfill}
        />
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.519,1.231,2.75,2.75,2.75h4.514c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.764v-6.5H3.5v-1.5h3V3.5h1.5v3h6.5v2.761c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-1.519-1.231-2.75-2.75-2.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default tableDownload;
