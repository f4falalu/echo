import React from 'react';

import { iconProps } from './iconProps';

function mediaNext(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'media next';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M12.667,7.59L4.413,3.021c-.511-.283-1.116-.275-1.618,.022-.498,.293-.795,.812-.795,1.387V13.57c0,.575,.297,1.094,.795,1.387,.258,.152,.542,.229,.828,.229,.271,0,.542-.069,.791-.207l8.254-4.57c.514-.285,.833-.825,.833-1.41s-.319-1.125-.833-1.41Z"
          fill={fill}
        />
        <path
          d="M15.25,2c-.414,0-.75,.336-.75,.75V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default mediaNext;
