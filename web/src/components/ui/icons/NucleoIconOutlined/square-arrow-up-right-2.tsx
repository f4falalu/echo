import React from 'react';
import { iconProps } from './iconProps';



function squareArrowUpRight2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px square arrow up right 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M11,7l-5.689,5.689c-.945,.945-2.561,.276-2.561-1.061V4.75c0-1.105,.895-2,2-2H13.25c1.105,0,2,.895,2,2V13.25c0,1.105-.895,2-2,2H6.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6.75 6.75L11.25 6.75 11.25 11.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default squareArrowUpRight2;