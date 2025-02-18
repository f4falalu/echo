import React from 'react';

import { iconProps } from './iconProps';

function suitDiamonds(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'suit diamonds';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M12.195,5.033c-.953-1.159-1.809-2.39-2.546-3.66-.268-.463-1.029-.463-1.297,0-.737,1.27-1.594,2.5-2.546,3.659-.992,1.206-2.102,2.351-3.301,3.404-.162,.143-.255,.348-.255,.563s.093,.421,.255,.563c1.199,1.053,2.309,2.198,3.3,3.403,.953,1.159,1.809,2.39,2.546,3.66,.134,.231,.381,.374,.648,.374s.515-.142,.648-.374c.737-1.27,1.594-2.5,2.546-3.659,.992-1.206,2.102-2.351,3.301-3.404,.162-.143,.255-.348,.255-.563s-.093-.421-.255-.563c-1.199-1.053-2.309-2.198-3.3-3.403Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default suitDiamonds;
