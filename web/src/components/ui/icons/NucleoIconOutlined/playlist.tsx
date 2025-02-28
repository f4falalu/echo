import React from "react";

import { iconProps } from "./iconProps";

function playlist(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px playlist";

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
          d="M11.037,9.629l-3.14-1.832c-.287-.167-.647,.04-.647,.371v3.663c0,.332,.36,.539,.647,.371l3.14-1.832c.284-.166,.284-.577,0-.743Z"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 1.75L13.25 1.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="10.5"
          width="13.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.25"
          y="4.75"
        />
      </g>
    </svg>
  );
}

export default playlist;
