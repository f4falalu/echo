import React from "react";

import { iconProps } from "./iconProps";

function chartBubble(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px chart bubble";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle cx="11.75" cy="14" fill="#212121" r="2.5" />
        <circle cx="12.25" cy="5.75" fill="#212121" r="4.25" />
        <circle cx="4.5" cy="11" fill="#212121" r="3" />
      </g>
    </svg>
  );
}

export default chartBubble;
