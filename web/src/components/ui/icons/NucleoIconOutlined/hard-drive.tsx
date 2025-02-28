import React from "react";

import { iconProps } from "./iconProps";

function hardDrive(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px hard drive";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <rect
          height="5"
          width="14.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="9.75"
        />
        <path
          d="M1.841,10.739l2.204-6.621c.272-.817,1.036-1.368,1.898-1.368h6.116c.861,0,1.626,.551,1.898,1.368l2.204,6.621"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 12.25L7 12.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default hardDrive;
