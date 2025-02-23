import React from 'react';

import { iconProps } from './iconProps';

function location3(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'location 3';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,1c-2.546,0-5.179,1.862-5.179,4.978,0,2.827,4.161,7.289,4.635,7.789,.142,.149,.338,.233,.544,.233s.402-.084,.544-.233c.474-.5,4.635-4.961,4.635-7.789,0-3.116-2.633-4.978-5.179-4.978Zm0,6.5c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5,.672,1.5,1.5-.672,1.5-1.5,1.5Z"
          fill={fill}
        />
        <path
          d="M15.25,17H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default location3;
