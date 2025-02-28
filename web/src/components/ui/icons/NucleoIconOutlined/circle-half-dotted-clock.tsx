import React from "react";

import { iconProps } from "./iconProps";

function circleHalfDottedClock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px circle half dotted clock";

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
          d="M9 4.75L9 9 12.25 11.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,1.75c4.004,0,7.25,3.246,7.25,7.25s-3.246,7.25-7.25,7.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.873" cy="14.127" fill="#212121" r=".75" />
        <circle cx="1.75" cy="9" fill="#212121" r=".75" />
        <circle cx="3.873" cy="3.873" fill="#212121" r=".75" />
        <circle cx="6.226" cy="15.698" fill="#212121" r=".75" />
        <circle cx="2.302" cy="11.774" fill="#212121" r=".75" />
        <circle cx="2.302" cy="6.226" fill="#212121" r=".75" />
        <circle cx="6.226" cy="2.302" fill="#212121" r=".75" />
      </g>
    </svg>
  );
}

export default circleHalfDottedClock;
