import React from 'react';
import { iconProps } from './iconProps';



function I12px_alertWarning(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px alert warning";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6 1.25L6 7.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="6" cy="10.5" fill={secondaryfill} r="1" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default I12px_alertWarning;