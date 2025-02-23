import React from 'react';

import { iconProps } from './iconProps';

function codePullRequest(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'code pull request';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M12.25,3h-1.689l.97-.97c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2.25,2.25c-.293,.293-.293,.768,0,1.061l2.25,2.25c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.97-.97h1.689c.689,0,1.25,.561,1.25,1.25v6.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V5.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill={secondaryfill}
        />
        <path
          d="M3.75,13c-.414,0-.75-.336-.75-.75V5.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <circle cx="14.25" cy="14.25" fill={fill} r="2.5" />
        <circle cx="3.75" cy="14.25" fill={fill} r="2.5" />
        <circle cx="3.75" cy="3.75" fill={fill} r="2.5" />
      </g>
    </svg>
  );
}

export default codePullRequest;
