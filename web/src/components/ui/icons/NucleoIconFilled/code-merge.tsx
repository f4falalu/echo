import React from 'react';

import { iconProps } from './iconProps';

function codeMerge(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'code merge';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M11,11.75c-3.032,0-5.5-2.467-5.5-5.5,0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v10c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-5.684c1.283,1.631,3.269,2.684,5.5,2.684,.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
        <circle cx="4.75" cy="4" fill={fill} r="2.75" />
        <circle cx="13.25" cy="12.5" fill={fill} r="2.75" />
      </g>
    </svg>
  );
}

export default codeMerge;
