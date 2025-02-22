import React from 'react';
import { iconProps } from './iconProps';

function positionTopRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px position top right';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect
          height="5.5"
          width="5.5"
          fill="none"
          rx="1"
          ry="1"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 12.5 5.5)"
          x="9.75"
          y="2.75"
        />
        <path
          d="M2.75,3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill={fill}
        />
        <path
          d="M2.75,6.625c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75c0,.414,.336,.75,.75,.75Z"
          fill={fill}
        />
        <path
          d="M2.75,9.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75c0,.414,.336,.75,.75,.75Z"
          fill={fill}
        />
        <path
          d="M2.75,12.875c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill={fill}
        />
        <path
          d="M15.25,12.875c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill={fill}
        />
        <path
          d="M2.75,16c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill={fill}
        />
        <path
          d="M5.875,16c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill={fill}
        />
        <path
          d="M5.875,3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill={fill}
        />
        <path
          d="M9,16c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill={fill}
        />
        <path
          d="M15.25,16c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill={fill}
        />
        <circle cx="12.125" cy="15.25" fill={fill} r=".75" />
      </g>
    </svg>
  );
}

export default positionTopRight;
