import React from 'react';

import { iconProps } from './iconProps';

function cropAlphaGrid(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'crop alpha grid';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path d="M6 6H7.5V7.5H6z" fill={secondaryfill} />
        <path d="M9 6H10.5V7.5H9z" fill={secondaryfill} />
        <path d="M10.5 7.5H12V9H10.5z" fill={secondaryfill} />
        <path d="M7.5 7.5H9V9H7.5z" fill={secondaryfill} />
        <path d="M6 9H7.5V10.5H6z" fill={secondaryfill} />
        <path d="M9 9H10.5V10.5H9z" fill={secondaryfill} />
        <path d="M10.5 10.5H12V12H10.5z" fill={secondaryfill} />
        <path d="M7.5 10.5H9V12H7.5z" fill={secondaryfill} />
        <path
          d="M13.75,17c-.414,0-.75-.336-.75-.75V5.25c0-.138-.112-.25-.25-.25H6.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6c.965,0,1.75,.785,1.75,1.75v11c0,.414-.336,.75-.75,.75Z"
          fill={fill}
        />
        <path
          d="M4.25,5H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={fill}
        />
        <path
          d="M16.25,14.5H5.25c-.965,0-1.75-.785-1.75-1.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V12.75c0,.138,.112,.25,.25,.25h11c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default cropAlphaGrid;
