import React from 'react';
import { iconProps } from './iconProps';



function I12px_pin(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px pin";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m10.185,4.744c0,1.899-2.482,4.948-3.624,6.25-.299.341-.825.341-1.123,0-1.141-1.301-3.624-4.351-3.624-6.25,0-2.527,2.163-3.994,4.185-3.994s4.185,1.467,4.185,3.994Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="6" cy="5" fill={secondaryfill} r="1" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default I12px_pin;