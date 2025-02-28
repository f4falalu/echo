import React from "react";

import { iconProps } from "./iconProps";

function shapeCircle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px shape circle";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle cx="9" cy="9" fill="#212121" r="8" />
      </g>
    </svg>
  );
}

export default shapeCircle;
