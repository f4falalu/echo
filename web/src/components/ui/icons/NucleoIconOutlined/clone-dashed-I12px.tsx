import React from "react";

import { iconProps } from "./iconProps";

function cloneDashed(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px clone dashed";

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
          d="m6,11.25h-.75c-.828,0-1.5-.672-1.5-1.5v-1.5"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8.333,3.75h1.417c.828,0,1.5.672,1.5,1.5v.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9,11.25h.75c.828,0,1.5-.672,1.5-1.5v-.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7.5"
          width="7.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y=".75"
        />
      </g>
    </svg>
  );
}

export default cloneDashed;
