import React from 'react';

import { iconProps } from './iconProps';

function circleSparkle(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'circle sparkle';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm3.526,8.697l-2.027,.802-.802,2.027c-.113,.286-.39,.474-.697,.474s-.584-.188-.697-.474l-.802-2.027-2.027-.802c-.286-.113-.474-.39-.474-.697s.188-.584,.474-.697l2.027-.802,.802-2.027c.226-.572,1.169-.572,1.395,0l.802,2.027,2.027,.802c.286,.113,.474,.39,.474,.697s-.188,.584-.474,.697Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default circleSparkle;
