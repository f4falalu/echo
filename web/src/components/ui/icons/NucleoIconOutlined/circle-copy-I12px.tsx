import React from "react";

import { iconProps } from "./iconProps";

function circleCopy(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px circle copy";

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
          d="m6.5,1.338c-.58-.367-1.262-.588-2-.588C2.429.75.75,2.429.75,4.5c0,.737.22,1.42.588,2"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="7.5"
          cy="7.5"
          fill="none"
          r="3.75"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default circleCopy;
