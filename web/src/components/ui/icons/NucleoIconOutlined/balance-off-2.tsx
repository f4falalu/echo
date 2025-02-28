import React from "react";

import { iconProps } from "./iconProps";

function balanceOff2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px balance off 2";

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
          d="M16.132 9.055L1.868 6.445"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.486,10.53l2.817,4.878c.216,.374-.054,.841-.486,.841H6.183c-.432,0-.702-.467-.486-.841l2.817-4.878c.216-.374,.755-.374,.971,0Z"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14"
          cy="4"
          fill="none"
          r="2.25"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="3.25"
          cy="2.75"
          fill="none"
          r="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default balanceOff2;
