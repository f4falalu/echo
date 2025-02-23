import React from 'react';
import { iconProps } from './iconProps';

function folderReplace(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px folder replace';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M11.874,10.75h2.876c.828,0,1.5,.672,1.5,1.5v2.5c0,.828-.672,1.5-1.5,1.5h-6c-.828,0-1.5-.672-1.5-1.5v-5c0-.552,.448-1,1-1h1.524c.301,0,.587,.136,.776,.37l1.323,1.63Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,6.25v-1c0-.828-.672-1.5-1.5-1.5h-2.876l-1.323-1.63c-.19-.234-.475-.37-.776-.37h-1.524c-.552,0-1,.448-1,1V7.75c0,.828,.672,1.5,1.5,1.5h1.5"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.745,14.708c-1.416-.24-2.495-1.473-2.495-2.958"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.255,5.292c1.416,.24,2.495,1.473,2.495,2.958"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default folderReplace;
