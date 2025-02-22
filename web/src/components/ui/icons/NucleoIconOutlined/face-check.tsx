import React from 'react';
import { iconProps } from './iconProps';

function faceCheck(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px face check';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M11.25,11.758c-.472,.746-1.304,1.242-2.25,1.242s-1.778-.496-2.25-1.242"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 3.75L13.859 5.25 17.256 0.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.562,1.923c-.504-.111-1.025-.173-1.562-.173C4.996,1.75,1.75,4.996,1.75,9s3.246,7.25,7.25,7.25,7.25-3.246,7.25-7.25c0-.796-.133-1.56-.37-2.277"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="9" fill={secondaryfill} r="1" />
        <circle cx="12" cy="9" fill={secondaryfill} r="1" />
      </g>
    </svg>
  );
}

export default faceCheck;
