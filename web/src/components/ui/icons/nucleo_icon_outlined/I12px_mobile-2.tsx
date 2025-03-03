import React from 'react';
import { iconProps } from './iconProps';



function I12px_mobile2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px mobile 2";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="8.5" width="10.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} transform="rotate(-90 6 6)" x=".75" y="1.75"/>
		<path d="M7.25 0.75L7.25 1.75 4.75 1.75 4.75 0.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="6" cy="8.5" fill={secondaryfill} r="1" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default I12px_mobile2;