import React from "react";

import { iconProps } from "./iconProps";

function circlePlay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px circle play";

  return (
    <svg
      height="12"
      width="12"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle
          cx="6"
          cy="6"
          fill="none"
          r="5.25"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.724,5.482l-2.308-1.385c-.403-.242-.916.048-.916.518v2.771c0,.47.513.76.916.518l2.308-1.385c.391-.235.391-.802,0-1.037Z"
          fill="#212121"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default circlePlay;
