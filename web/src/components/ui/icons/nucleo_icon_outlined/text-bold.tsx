import React from 'react';
import { iconProps } from './iconProps';



function textBold(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px text bold";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6.25,2.25h3.75c1.795,0,3.25,1.455,3.25,3.25h0c0,1.795-1.455,3.25-3.25,3.25h-3.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6.25,8.75h4.5c1.933,0,3.5,1.567,3.5,3.5h0c0,1.933-1.567,3.5-3.5,3.5H6.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6.25,15.75h-1.5c-.552,0-1-.448-1-1V3.25c0-.552,.448-1,1-1h1.5V15.75Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default textBold;