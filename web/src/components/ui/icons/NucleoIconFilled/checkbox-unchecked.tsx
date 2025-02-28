import React from "react";

import { iconProps } from "./iconProps";

function checkboxUnchecked(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px checkbox unchecked";

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
          width="11"
          fill="#212121"
          rx="2.75"
          ry="2.75"
          strokeWidth="0"
          x=".5"
          y=".5"
        />
      </g>
    </svg>
  );
}

export default checkboxUnchecked;
