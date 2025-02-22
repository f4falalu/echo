import React from 'react';
import { iconProps } from './iconProps';

function watch2Heart(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px watch 2 heart';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M12 1.75L6 1.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12 16.25L6 16.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.798,11.949c.127,.068,.276,.068,.403,0,.673-.358,2.798-1.655,2.798-3.763,.003-.926-.73-1.68-1.64-1.686-.547,.007-1.056,.288-1.36,.752-.304-.463-.813-.744-1.36-.752-.91,.006-1.643,.76-1.64,1.686,0,2.109,2.125,3.406,2.798,3.763Z"
          fill={secondaryfill}
        />
        <rect
          height="9.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="3.75"
          y="4.25"
        />
      </g>
    </svg>
  );
}

export default watch2Heart;
