import React from 'react';
import { iconProps } from './iconProps';



function I12px_video(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px video";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M11.25 3.75L8.75 6 11.25 8.25 11.25 3.75z" fill={secondaryfill} stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="3.25" cy="4.25" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<rect height="8.5" width="8" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x=".753" y="1.75"/>
	</g>
</svg>
	);
};

export default I12px_video;