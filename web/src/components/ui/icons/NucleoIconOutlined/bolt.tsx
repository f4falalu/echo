import React from "react";

import { iconProps } from "./iconProps";

function bolt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px bolt";

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
          d="m8.597,16.41l5.872-8.265c.118-.166,0-.395-.204-.395h-5.016l.604-5.98c.037-.26-.299-.394-.451-.18L3.531,9.855c-.118.166,0,.395.204.395h5.016l-.604,5.98c-.037.26.299.394.451.18Z"
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

export default bolt;
