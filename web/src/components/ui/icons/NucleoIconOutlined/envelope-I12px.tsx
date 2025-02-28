import React from "react";

import { iconProps } from "./iconProps";

function envelope(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px envelope";

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
          d="M0.75 4.5L6 6.75 11.25 4.5"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="8.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y="1.75"
        />
      </g>
    </svg>
  );
}

export default envelope;
