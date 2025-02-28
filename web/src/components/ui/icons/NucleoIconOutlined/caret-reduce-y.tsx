import React from 'react';

import { iconProps } from './iconProps';

function caretReduceY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret reduce y';

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.414,7.499l2.348-3.468c.225-.332-.013-.78-.414-.78H6.652c-.401,0-.639,.448-.414,.78l2.348,3.468c.198,.293,.63,.293,.828,0Z"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.414,10.501l2.348,3.468c.225,.332-.013,.78-.414,.78H6.652c-.401,0-.639-.448-.414-.78l2.348-3.468c.198-.293,.63-.293,.828,0Z"
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

export default caretReduceY;
