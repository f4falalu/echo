import React from "react";

import { iconProps } from "./iconProps";

function mirrorObj(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px mirror obj";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle cx="9" cy="9" fill="#212121" r=".75" />
        <circle cx="9" cy="2.75" fill="#212121" r=".75" />
        <circle cx="9" cy="5.875" fill="#212121" r=".75" />
        <circle cx="9" cy="12.125" fill="#212121" r=".75" />
        <circle cx="9" cy="15.25" fill="#212121" r=".75" />
        <path
          d="M6.5,13.98l-3.017,.724c-.629,.151-1.233-.326-1.233-.972V5.538c0-.462,.317-.864,.767-.972l3.483-.836"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5,13.98l3.017,.724c.629,.151,1.233-.326,1.233-.972V5.538c0-.462-.317-.864-.767-.972l-3.483-.836"
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

export default mirrorObj;
