import React from "react";

import { iconProps } from "./iconProps";

function adjustContrast(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px adjust contrast";

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
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1ZM2.5,9c0-3.33,2.519-6.08,5.75-6.453V15.453c-3.231-.374-5.75-3.123-5.75-6.453Z"
          fill="#212121"
        />
      </g>
    </svg>
  );
}

export default adjustContrast;
