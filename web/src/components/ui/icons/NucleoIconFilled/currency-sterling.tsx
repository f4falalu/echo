import React from 'react';

import { iconProps } from './iconProps';

function currencySterling(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'currency sterling';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10.25,10.5H5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M13,16H5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c.552,0,1-.449,1-1V5.75c0-2.068,1.683-3.75,3.75-3.75s3.75,1.682,3.75,3.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-1.241-1.01-2.25-2.25-2.25s-2.25,1.009-2.25,2.25v7.75c0,.355-.074,.694-.209,1h5.709c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default currencySterling;
