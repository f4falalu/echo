import React from "react";

import { iconProps } from "./iconProps";

function section(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px section";

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
          d="m10.25,1.5H1.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h8.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="#212121"
          strokeWidth="0"
        />
        <path
          d="m10.25,12H1.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h8.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="#212121"
          strokeWidth="0"
        />
        <rect
          height="6"
          width="12"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          y="3"
        />
      </g>
    </svg>
  );
}

export default section;
