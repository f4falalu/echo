import React from "react";

import { iconProps } from "./iconProps";

function copies5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px copies 5";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <path
          d="m4.75,10.25h-1c-1.1046,0-2-.8954-2-2V3.75c0-1.1046.8954-2,2-2h4.5c1.1046,0,2,.8954,2,2v1"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.75,13.25h-1c-1.1046,0-2-.8954-2-2v-4.5c0-1.1046.8954-2,2-2h4.5c1.1046,0,2,.8954,2,2v1"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="8.5"
          width="8.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.75"
          y="7.75"
        />
      </g>
    </svg>
  );
}

export default copies5;
