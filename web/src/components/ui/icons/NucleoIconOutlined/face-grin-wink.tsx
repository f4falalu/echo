import React from "react";

import { iconProps } from "./iconProps";

function faceGrinWink(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px face grin wink";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="8" fill="#212121" r="1" />
        <path
          d="M10,8.25c.138-.105,.604-.432,1.281-.422,.639,.01,1.077,.314,1.219,.422"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.897,10.757c-.154-.154-.366-.221-.583-.189h0c-1.532,.239-3.112,.238-4.638-.001-.214-.032-.421,.035-.572,.185-.154,.153-.227,.376-.193,.598,.23,1.511,1.558,2.651,3.089,2.651s2.86-1.141,3.089-2.654c.033-.216-.039-.436-.192-.589Z"
          fill="#212121"
        />
      </g>
    </svg>
  );
}

export default faceGrinWink;
