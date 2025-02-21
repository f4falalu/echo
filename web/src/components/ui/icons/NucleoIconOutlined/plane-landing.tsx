import React from 'react';
import { iconProps } from './iconProps';

function planeLanding(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px plane landing';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2.75 15.25L15.25 15.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.617,5.273l1.476-.041c.4-.011,.768,.218,.936,.582l.709,1.541,10.149,1.681c.896,.136,1.505,.982,1.35,1.875h0c-.151,.869-.972,1.456-1.843,1.319l-8.422-1.45c-.257-.044-.503-.138-.724-.277l-2.09-1.312c-.44-.276-.756-.713-.879-1.218l-.661-2.7Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.942,7.894L5.625,2.181l1.704,.062c.337,.012,.645,.193,.819,.481l3.496,5.776"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default planeLanding;
