import React from "react";

import { iconProps } from "./iconProps";

function alignVertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px align vertical";

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
          d="M16.25,9.75H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h14.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="#212121"
        />
        <rect
          height="12"
          width="5"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          x="3"
          y="3"
        />
        <rect
          height="8"
          width="5"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          x="10"
          y="5"
        />
      </g>
    </svg>
  );
}

export default alignVertical;
