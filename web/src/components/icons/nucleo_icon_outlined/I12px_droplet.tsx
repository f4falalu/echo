import React from 'react';
import { iconProps } from './iconProps';



function I12px_droplet(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px droplet";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m6,11.25c2.209,0,4-1.789,4-3.995,0-3.035-2.242-4.333-4-6.505-1.758,2.172-4,3.47-4,6.505,0,2.206,1.791,3.995,4,3.995Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m6,8.75c-.827,0-1.5-.671-1.5-1.495" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default I12px_droplet;