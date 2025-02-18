import React from 'react';
import { iconProps } from './iconProps';



function bracketsCurlyDots(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px brackets curly dots";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="12.25" fill={secondaryfill} r=".75"/>
		<circle cx="11.75" cy="12.25" fill={secondaryfill} r=".75"/>
		<circle cx="6.25" cy="12.25" fill={secondaryfill} r=".75"/>
		<path d="M6.25,15.25h-1c-1.105,0-2-.895-2-2v-2.625c0-.897-.728-1.625-1.625-1.625,.897,0,1.625-.728,1.625-1.625v-2.625c0-1.105,.895-2,2-2h1" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.75,15.25h1c1.105,0,2-.895,2-2v-2.625c0-.897,.728-1.625,1.625-1.625-.897,0-1.625-.728-1.625-1.625v-2.625c0-1.105-.895-2-2-2h-1" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default bracketsCurlyDots;