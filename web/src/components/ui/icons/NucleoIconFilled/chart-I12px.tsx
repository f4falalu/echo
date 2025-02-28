import React from "react";

import { iconProps } from "./iconProps";

function chart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px chart";

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
          height="9"
          width="4"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          x="1.5"
          y="7"
        />
        <rect
          height="5"
          width="4"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          x="12.5"
          y="11"
        />
      </g>
    </svg>
  );
}

export default chart;
