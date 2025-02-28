import React from "react";

import { iconProps } from "./iconProps";

function stackY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px stack y";

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
          height="6"
          width="10"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="1"
          y="3"
        />
        <path
          d="m10.25,1.5H1.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h8.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="#212121"
          strokeWidth="0"
        />
        <path
          d="m10.25,12H1.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h8.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="#212121"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default stackY;
