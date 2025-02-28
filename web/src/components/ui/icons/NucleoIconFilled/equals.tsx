import React from "react";

import { iconProps } from "./iconProps";

function equals(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px equals";

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
          d="m15.25,7.5H2.75c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h12.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="#212121"
          strokeWidth="0"
        />
        <path
          d="m15.25,12H2.75c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h12.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="#212121"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default equals;
