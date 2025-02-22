import React from 'react';

import { iconProps } from './iconProps';

function keyboard2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'keyboard 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.25,3H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75Zm-4.125,5h.5c.276,0,.5,.224,.5,.5v.5c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5c0-.276,.224-.5,.5-.5Zm-1.875-1.5c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5Zm-.875,1.5h.5c.276,0,.5,.224,.5,.5v.5c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5c0-.276,.224-.5,.5-.5Zm-1.75,1c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5Zm-.125-2v-.5c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5Zm5.75,5H6.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm.75-4.5h-.5c-.276,0-.5-.224-.5-.5v-.5c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5c0,.276-.224,.5-.5,.5Zm1.875,1.5c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default keyboard2;
