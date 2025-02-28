import React from "react";

import { iconProps } from "./iconProps";

function align2Bottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px align 2 bottom";

  return (
    <svg
      height="12"
      width="12"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <path
          d="M11.25 11.25L0.75 11.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7.5"
          width="4.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="3.75"
          y=".75"
        />
      </g>
    </svg>
  );
}

export default align2Bottom;
