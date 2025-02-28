import React from "react";

import { iconProps } from "./iconProps";

function circleDotted(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px circle dotted";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle cx="3.873" cy="14.127" fill="#212121" r=".75" />
        <circle cx="1.75" cy="9" fill="#212121" r=".75" />
        <circle cx="3.873" cy="3.873" fill="#212121" r=".75" />
        <circle cx="6.226" cy="15.698" fill="#212121" r=".75" />
        <circle cx="2.302" cy="11.774" fill="#212121" r=".75" />
        <circle cx="2.302" cy="6.226" fill="#212121" r=".75" />
        <circle cx="6.226" cy="2.302" fill="#212121" r=".75" />
        <circle cx="9" cy="1.75" fill="#212121" r=".75" />
        <circle cx="9" cy="16.25" fill="#212121" r=".75" />
        <circle cx="14.127" cy="14.127" fill="#212121" r=".75" />
        <circle cx="16.25" cy="9" fill="#212121" r=".75" />
        <circle cx="14.127" cy="3.873" fill="#212121" r=".75" />
        <circle cx="11.774" cy="15.698" fill="#212121" r=".75" />
        <circle cx="15.698" cy="11.774" fill="#212121" r=".75" />
        <circle cx="15.698" cy="6.226" fill="#212121" r=".75" />
        <circle cx="11.774" cy="2.302" fill="#212121" r=".75" />
      </g>
    </svg>
  );
}

export default circleDotted;
