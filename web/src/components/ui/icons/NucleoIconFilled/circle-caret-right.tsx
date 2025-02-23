import React from 'react';

import { iconProps } from './iconProps';

function circleCaretRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'circle caret right';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm2.157,8.621l-2.987,2.022c-.498,.337-1.17-.02-1.17-.621V6.978c0-.602,.672-.958,1.17-.621l2.987,2.022c.439,.297,.439,.945,0,1.242Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default circleCaretRight;
