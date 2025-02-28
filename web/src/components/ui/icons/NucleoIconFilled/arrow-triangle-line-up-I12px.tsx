import React from "react";

import { iconProps } from "./iconProps";

function arrowTriangleLineUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px arrow triangle line up";

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
          d="M9,16.5c-.414,0-.75-.336-.75-.75V7.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V15.75c0,.414-.336,.75-.75,.75Z"
          fill="#212121"
        />
        <path
          d="M10.035,2.033c-.466-.688-1.604-.688-2.07,0l-3.058,4.517c-.26,.384-.286,.877-.069,1.287,.217,.41,.641,.664,1.104,.664h6.115c.463,0,.887-.254,1.104-.664,.217-.409,.191-.902-.069-1.287l-3.058-4.517Z"
          fill="#212121"
        />
      </g>
    </svg>
  );
}

export default arrowTriangleLineUp;
