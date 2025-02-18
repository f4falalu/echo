import React from 'react';
import { iconProps } from './iconProps';



function sortArrows(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px sort arrows";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m6.4,1.283l2,2.667c.247.33.012.8-.4.8h-4c-.412,0-.647-.47-.4-.8l2-2.667c.2-.267.6-.267.8,0Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m6.4,10.717l2-2.667c.247-.33.012-.8-.4-.8h-4c-.412,0-.647.47-.4.8l2,2.667c.2.267.6.267.8,0Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default sortArrows;