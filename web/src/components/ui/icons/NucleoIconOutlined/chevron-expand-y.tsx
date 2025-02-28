import React from "react";

import { iconProps } from "./iconProps";

function chevronExpandY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px chevron expand y";

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
          d="M12.5 6.25L9 2.75 5.5 6.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.5 11.75L9 15.25 5.5 11.75"
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

export default chevronExpandY;
