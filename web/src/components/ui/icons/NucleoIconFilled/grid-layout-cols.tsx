import React from "react";

import { iconProps } from "./iconProps";

function gridLayoutCols(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px grid layout cols";

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
          height="11"
          width="5"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="6.5"
          y=".5"
        />
        <rect
          height="11"
          width="5"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x=".5"
          y=".5"
        />
      </g>
    </svg>
  );
}

export default gridLayoutCols;
