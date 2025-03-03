import React from 'react';
import { iconProps } from './iconProps';



function I12px_calendar(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px calendar";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M1.25 4.75L10.75 4.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3.75 0.75L3.75 1.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M8.25 0.75L8.25 1.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="9.5" width="9.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="1.25" y="1.75"/>
		<circle cx="4" cy="7.5" fill={secondaryfill} r="1" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default I12px_calendar;