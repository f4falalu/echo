import React from "react";

import { iconProps } from "./iconProps";

function caretRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px caret right";

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
          d="m9.064,6.624l-4.648,3.099c-.498.332-1.166-.025-1.166-.624V2.901c0-.599.668-.956,1.166-.624l4.648,3.099c.445.297.445.951,0,1.248Z"
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

export default caretRight;
