import React from "react";

import { iconProps } from "./iconProps";

function stack3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px stack 3";

  return (
    <svg
      height="12"
      width="12"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <rect
          height="10.5"
          width="7"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 6 4.75)"
          x="2.5"
          y="-.5"
        />
        <path
          d="M2.75 11.25L9.25 11.25"
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

export default stack3;
