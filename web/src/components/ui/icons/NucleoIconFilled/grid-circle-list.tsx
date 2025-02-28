import React from "react";

import { iconProps } from "./iconProps";

function gridCircleList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px grid circle list";

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
          d="M15.25,3h-4.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="#212121"
        />
        <path
          d="M15.25,6h-4.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="#212121"
        />
        <path
          d="M15.25,10.5h-4.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="#212121"
        />
        <path
          d="M15.25,13.5h-4.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="#212121"
        />
        <circle cx="5" cy="5" fill="#212121" r="3" />
        <circle cx="5" cy="13" fill="#212121" r="3" />
      </g>
    </svg>
  );
}

export default gridCircleList;
