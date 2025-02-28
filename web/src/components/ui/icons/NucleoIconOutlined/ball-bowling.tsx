import React from "react";

import { iconProps } from "./iconProps";

function ballBowling(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px ball bowling";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.5" cy="7" fill="#212121" r="1" />
        <circle cx="8.5" cy="5" fill="#212121" r="1" />
        <circle cx="8.5" cy="9" fill="#212121" r="1" />
      </g>
    </svg>
  );
}

export default ballBowling;
