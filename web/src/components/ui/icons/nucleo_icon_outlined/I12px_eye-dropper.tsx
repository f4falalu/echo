import React from 'react';
import { iconProps } from './iconProps';



function I12px_eyeDropper(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px eye dropper";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m8.375,5.875l-4.142,4.142c-.621.621-1.629.621-2.25,0h0c-.621-.621-.621-1.629,0-2.25L6.125,3.625" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M0.75 11.25L2 10" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m6.125,3.625l2.148-2.148c.621-.621,1.629-.621,2.25,0h0c.621.621.621,1.629,0,2.25l-2.148,2.148" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9.5 7L5 2.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default I12px_eyeDropper;