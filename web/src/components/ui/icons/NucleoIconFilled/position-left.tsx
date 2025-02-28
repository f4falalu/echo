import React from "react";

import { iconProps } from "./iconProps";

function positionLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px position left";

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
          width="5"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="2"
          y="2"
        />
        <circle cx="9" cy="2.75" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="9" cy="15.25" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="15.25" cy="9" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="12.125" cy="15.25" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="15.25" cy="15.25" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="12.125" cy="2.75" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="15.25" cy="2.75" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="15.25" cy="5.875" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="15.25" cy="12.125" fill="#212121" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default positionLeft;
