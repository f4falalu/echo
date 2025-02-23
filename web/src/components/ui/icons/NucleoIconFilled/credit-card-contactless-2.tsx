import React from 'react';

import { iconProps } from './iconProps';

function creditCardContactless2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'credit card contactless 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10.768,4.732c-.192,0-.384-.073-.53-.22-.66-.661-1.814-.661-2.475,0-.292,.292-.767,.293-1.061,0-.293-.293-.293-.768,0-1.061,1.227-1.228,3.369-1.228,4.596,0,.293,.293,.293,.768,0,1.061-.146,.146-.339,.219-.53,.219Z"
          fill={secondaryfill}
        />
        <path
          d="M12.535,2.964c-.192,0-.384-.073-.53-.22-.803-.803-1.869-1.245-3.005-1.245s-2.202,.442-3.005,1.245c-.293,.293-.768,.293-1.061,0-.293-.292-.293-.768,0-1.061,1.085-1.086,2.529-1.684,4.065-1.684s2.98,.598,4.065,1.684c.293,.293,.293,.768,0,1.061-.146,.146-.339,.22-.53,.22Z"
          fill={secondaryfill}
        />
        <path
          d="M6.794,6.19c-.432-.085-.831-.295-1.15-.613-.328-.328-.533-.732-.617-1.155-.328-.064-.622-.221-.891-.422h-.387c-1.517,0-2.75,1.233-2.75,2.75v.75H7.592c-.403-.325-.693-.784-.798-1.31Z"
          fill={fill}
        />
        <path
          d="M14.25,4h-.386c-.268,.2-.563,.357-.891,.422-.083,.423-.288,.826-.614,1.152-.321,.32-.72,.531-1.153,.616-.105,.526-.395,.985-.798,1.31h6.592v-.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill={fill}
        />
        <path
          d="M1,14.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-4.75H1v4.75Zm11.75-1.75h1c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75Zm-8.5,0h3c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75Z"
          fill={fill}
        />
        <circle cx="9" cy="5.75" fill={secondaryfill} r=".75" />
      </g>
    </svg>
  );
}

export default creditCardContactless2;
