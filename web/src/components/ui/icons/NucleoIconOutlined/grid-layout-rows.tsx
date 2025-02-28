import React from "react";

import { iconProps } from "./iconProps";

function gridLayoutRows(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px grid layout rows";

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
          height="4.5"
          width="12.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <rect
          height="4.5"
          width="12.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="10.75"
        />
      </g>
    </svg>
  );
}

export default gridLayoutRows;
