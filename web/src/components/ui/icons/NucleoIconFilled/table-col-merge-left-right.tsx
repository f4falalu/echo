import React from 'react';

import { iconProps } from './iconProps';

function tableColMergeLeftRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'table col merge left right';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2.868,4.707c.382,.153,.821-.034,.974-.419,.191-.479,.646-.788,1.158-.788h4V14.5H5c-.513,0-.967-.309-1.158-.788-.152-.386-.592-.572-.974-.419-.385,.153-.572,.589-.419,.974,.419,1.053,1.42,1.733,2.551,1.733H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75H5c-1.131,0-2.132,.68-2.551,1.733-.153,.385,.034,.821,.419,.974Z"
          fill={fill}
        />
        <path
          d="M.22,9.53l2.5,2.5c.293,.293,.768,.293,1.061,0s.293-.768,0-1.061l-1.22-1.22h3.689c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2.561l1.22-1.22c.293-.293,.293-.768,0-1.061-.146-.146-.338-.22-.53-.22s-.384,.073-.53,.22L.22,8.47c-.293,.293-.293,.768,0,1.061Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default tableColMergeLeftRight;
