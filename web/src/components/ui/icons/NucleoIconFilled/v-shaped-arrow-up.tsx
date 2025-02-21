import React from 'react';

import { iconProps } from './iconProps';

function vShapedArrowUp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'v shaped arrow up';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9.422,5.63c-.255-.173-.589-.173-.844,0L2.328,9.88c-.342,.233-.431,.699-.198,1.042,.233,.344,.7,.431,1.042,.198l5.828-3.963,5.828,3.963c.129,.088,.276,.13,.421,.13,.24,0,.476-.115,.621-.328,.233-.343,.144-.809-.198-1.042l-6.25-4.25Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default vShapedArrowUp;
