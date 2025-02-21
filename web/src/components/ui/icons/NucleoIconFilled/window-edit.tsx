import React from 'react';

import { iconProps } from './iconProps';

function windowEdit(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'window edit';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h5.046c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25v-5.25H15.5v.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.5c0-1.517-1.233-2.75-2.75-2.75ZM4,6c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,0c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill={fill}
        />
        <path
          d="M17.115,10.425c-.562-.563-1.537-.567-2.099-.006l-3.693,3.693c-.164,.164-.292,.358-.38,.578l-.63,1.56c-.112,.277-.049,.595,.162,.808,.144,.146,.337,.223,.534,.223,.092,0,.184-.017,.272-.051l1.514-.59c.228-.089,.43-.221,.602-.393l3.726-3.726c.279-.282,.433-.654,.431-1.049-.002-.396-.158-.768-.438-1.046Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default windowEdit;
