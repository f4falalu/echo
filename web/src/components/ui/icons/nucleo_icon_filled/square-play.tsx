import React from 'react';

import { iconProps } from './iconProps';

function squarePlay(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'square play';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-1.972,7.648l-3.65,2.129c-.118,.069-.248,.104-.378,.104-.128,0-.256-.034-.374-.101-.236-.135-.376-.378-.376-.65V6.871c0-.272,.141-.515,.376-.65,.236-.136,.517-.134,.751,.002l3.65,2.129c.233,.136,.373,.378,.373,.648s-.139,.512-.373,.648Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default squarePlay;
