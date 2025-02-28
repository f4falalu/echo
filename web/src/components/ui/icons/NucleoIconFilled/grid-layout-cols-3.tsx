import React from "react";

import { iconProps } from "./iconProps";

function gridLayoutCols3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px grid layout cols 3";

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
          height="14"
          width="4"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          x="7"
          y="2"
        />
        <rect
          height="14"
          width="4"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          x="12.5"
          y="2"
        />
        <rect
          height="14"
          width="4"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          x="1.5"
          y="2"
        />
      </g>
    </svg>
  );
}

export default gridLayoutCols3;
