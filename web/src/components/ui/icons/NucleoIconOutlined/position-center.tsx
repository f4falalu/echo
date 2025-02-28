import React from "react";

import { iconProps } from "./iconProps";

function positionCenter(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px position center";

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
          height="4.5"
          width="4.5"
          fill="none"
          rx=".818"
          ry=".818"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 9 9)"
          x="6.75"
          y="6.75"
        />
        <circle cx="15.25" cy="2.75" fill="#212121" r=".75" />
        <circle cx="15.25" cy="5.875" fill="#212121" r=".75" />
        <circle cx="15.25" cy="9" fill="#212121" r=".75" />
        <circle cx="2.75" cy="2.75" fill="#212121" r=".75" />
        <circle cx="2.75" cy="5.875" fill="#212121" r=".75" />
        <circle cx="2.75" cy="9" fill="#212121" r=".75" />
        <circle cx="15.25" cy="12.125" fill="#212121" r=".75" />
        <circle cx="2.75" cy="12.125" fill="#212121" r=".75" />
        <circle cx="15.25" cy="15.25" fill="#212121" r=".75" />
        <circle cx="12.125" cy="15.25" fill="#212121" r=".75" />
        <circle cx="12.125" cy="2.75" fill="#212121" r=".75" />
        <circle cx="9" cy="15.25" fill="#212121" r=".75" />
        <circle cx="5.875" cy="15.25" fill="#212121" r=".75" />
        <circle cx="9" cy="2.75" fill="#212121" r=".75" />
        <circle cx="5.875" cy="2.75" fill="#212121" r=".75" />
        <circle cx="2.75" cy="15.25" fill="#212121" r=".75" />
      </g>
    </svg>
  );
}

export default positionCenter;
