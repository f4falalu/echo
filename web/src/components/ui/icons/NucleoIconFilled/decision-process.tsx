import React from 'react';

import { iconProps } from './iconProps';

function decisionProcess(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'decision process';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M4.75,11c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M13.25,7.5c-.414,0-.75-.336-.75-.75v-2c0-.138-.112-.25-.25-.25h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.965,0,1.75,.785,1.75,1.75v2c0,.414-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M12.25,15h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.138,0,.25-.112,.25-.25v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2c0,.965-.785,1.75-1.75,1.75Z"
          fill={secondaryfill}
        />
        <path
          d="M17.386,8.357l-3.75-2.25c-.237-.143-.534-.143-.771,0l-3.75,2.25c-.226,.135-.364,.379-.364,.643s.138,.508,.364,.643l3.75,2.25c.119,.071,.252,.107,.386,.107s.267-.036,.386-.107l3.75-2.25c.226-.135,.364-.379,.364-.643s-.138-.508-.364-.643Z"
          fill={fill}
        />
        <rect height="4.5" width="7.5" fill={fill} rx="1.75" ry="1.75" x="1" y="1.5" />
        <rect height="4.5" width="7.5" fill={fill} rx="1.75" ry="1.75" x="1" y="12" />
      </g>
    </svg>
  );
}

export default decisionProcess;
