import React from "react";

import { iconProps } from "./iconProps";

function sortMiddleToBottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px sort middle to bottom";

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
          d="M11.5 12L9.25 14.25 11.5 16.5"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25 3.75L15.75 3.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25 14.25L6.25 14.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25,9H13.125c1.45,0,2.625,1.175,2.625,2.625h0c0,1.45-1.175,2.625-2.625,2.625h-3.875"
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

export default sortMiddleToBottom;
