import React from 'react';

import { iconProps } from './iconProps';

function duplicatePlus(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'duplicate plus';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2.801,12.748c-.365,0-.686-.268-.741-.64L1.03,5.184c-.108-.727,.073-1.452,.511-2.042,.437-.59,1.078-.975,1.805-1.083l6.924-1.029c1.259-.187,2.477,.507,2.954,1.689,.155,.384-.03,.821-.415,.976-.383,.156-.82-.03-.976-.415-.217-.537-.769-.854-1.343-.767L3.566,3.543c-.33,.049-.622,.224-.82,.492-.199,.268-.281,.598-.231,.928l1.029,6.924c.061,.41-.223,.792-.632,.852-.037,.006-.074,.008-.111,.008Z"
          fill={secondaryfill}
        />
        <path
          d="M14.25,4.5H7.25c-1.517,0-2.75,1.233-2.75,2.75v7c0,1.517,1.233,2.75,2.75,2.75h7c1.517,0,2.75-1.233,2.75-2.75V7.25c0-1.517-1.233-2.75-2.75-2.75Zm-1,7h-1.75v1.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.75h-1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.75v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.75h1.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default duplicatePlus;
