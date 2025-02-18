import React from 'react';

import { iconProps } from './iconProps';

function sharing(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'sharing';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M6.03,7.47l-2.47-2.47h1.689c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H1.75c-.414,0-.75,.336-.75,.75v3.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.689l2.47,2.47c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill={fill}
        />
        <path
          d="M16.25,3.5h-3.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.689l-2.47,2.47c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.47-2.47v1.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.5c0-.414-.336-.75-.75-.75Z"
          fill={fill}
        />
        <circle cx="9" cy="11.5" fill={secondaryfill} r="3.25" />
      </g>
    </svg>
  );
}

export default sharing;
