import React from "react";

import { iconProps } from "./iconProps";

function arrowTurnUp2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px arrow turn up 2";

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
          d="M9.75,2.75V13.25c0,1.105-.895,2-2,2H3.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.5 7L9.75 2.75 14 7"
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

export default arrowTurnUp2;
