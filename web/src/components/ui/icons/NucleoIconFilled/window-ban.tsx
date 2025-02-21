import React from 'react';

import { iconProps } from './iconProps';

function windowBan(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'window ban';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h4.618c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25v-5.25H15.5v.708c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.958c0-1.517-1.233-2.75-2.75-2.75ZM4,6c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,0c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill={fill}
        />
        <path
          d="M14,10c-2.206,0-4,1.794-4,4s1.794,4,4,4,4-1.794,4-4-1.794-4-4-4Zm0,1.5c.416,0,.802,.112,1.147,.292l-3.355,3.356c-.18-.345-.292-.732-.292-1.148,0-1.378,1.121-2.5,2.5-2.5Zm0,5c-.416,0-.802-.112-1.147-.292l3.355-3.356c.18,.345,.292,.732,.292,1.148,0,1.378-1.121,2.5-2.5,2.5Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default windowBan;
