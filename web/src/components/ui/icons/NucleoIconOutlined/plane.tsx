import React from 'react';
import { iconProps } from './iconProps';

function plane(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px plane';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M7.25,10.358l-6,.892v-1.574c0-.408,.248-.776,.627-.928l5.373-2.154"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,10.358l6,.892v-1.574c0-.408-.248-.776-.627-.928l-5.373-2.154"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,3.5v7.715c0,.522,.041,1.044,.122,1.56l.472,2.987c.09,.569,.58,.988,1.156,.988h0c.576,0,1.066-.419,1.156-.988l.472-2.987c.081-.516,.122-1.037,.122-1.56V3.5c0-.966-.784-1.75-1.75-1.75h0c-.966,0-1.75,.784-1.75,1.75Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.844,15.762l-.357-2.26-2.902,1.332c-.357,.164-.585,.52-.585,.912v.756c0,.296,.256,.526,.55,.496l3.895-.407c-.308-.17-.543-.46-.601-.828Z"
          fill={fill}
        />
        <path
          d="M10.156,15.762l.357-2.26,2.902,1.332c.357,.164,.585,.52,.585,.912v.756c0,.296-.256,.526-.55,.496l-3.895-.407c.308-.17,.543-.46,.601-.828Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default plane;
