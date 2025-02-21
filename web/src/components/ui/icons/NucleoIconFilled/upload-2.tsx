import React from 'react';

import { iconProps } from './iconProps';

function upload2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'upload 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.75,2.5h-.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75c.689,0,1.25,.561,1.25,1.25v7.5c0,.689-.561,1.25-1.25,1.25H4.25c-.689,0-1.25-.561-1.25-1.25V5.25c0-.689,.561-1.25,1.25-1.25h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75H13.75c1.517,0,2.75-1.233,2.75-2.75V5.25c0-1.517-1.233-2.75-2.75-2.75Z"
          fill={fill}
        />
        <path
          d="M5.47,6.78c.293,.293,.768,.293,1.061,0l1.72-1.72v6.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V5.061l1.72,1.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-3-3c-.293-.293-.768-.293-1.061,0l-3,3c-.293,.293-.293,.768,0,1.061Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default upload2;
