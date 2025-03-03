import React from 'react';
import { iconProps } from './iconProps';



function I12px_stack(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px stack";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="10.5" width="7" fill="none" rx="1.5" ry="1.5" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="1.25" y=".75"/>
		<path d="M11.25 9.25L11.25 2.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default I12px_stack;