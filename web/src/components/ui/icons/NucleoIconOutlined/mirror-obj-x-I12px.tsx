import React from "react";

import { iconProps } from "./iconProps";

function mirrorObjX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px mirror obj x";

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
          d="M6 0.75L6 11.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.5,1.25h-.25c-1.105,0-2,.895-2,2v5.5c0,1.105.895,2,2,2h.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8.5,10.75h.25c1.105,0,2-.895,2-2V3.25c0-1.105-.895-2-2-2h-.25"
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

export default mirrorObjX;
