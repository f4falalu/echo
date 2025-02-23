import React from 'react';

import { iconProps } from './iconProps';

function faceSmileClosedEyes(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'face smile closed eyes';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-3.5,8c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-1.103,.897-2,2-2s2,.897,2,2c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-.276-.225-.5-.5-.5s-.5,.224-.5,.5Zm6.384,3.159c-.63,.996-1.708,1.591-2.884,1.591s-2.254-.595-2.884-1.591c-.222-.35-.117-.813,.232-1.035,.354-.222,.814-.117,1.035,.233,.354,.559,.958,.893,1.616,.893s1.263-.333,1.616-.893c.221-.35,.683-.455,1.035-.233,.35,.221,.454,.685,.232,1.035Zm1.366-2.409c-.414,0-.75-.336-.75-.75,0-.276-.225-.5-.5-.5s-.5,.224-.5,.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-1.103,.897-2,2-2s2,.897,2,2c0,.414-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default faceSmileClosedEyes;
