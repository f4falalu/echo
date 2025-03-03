import React from 'react';
import { iconProps } from './iconProps';



function I12px_paperPlane3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px paper plane 3";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6 9.907L6 6.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m6.739,1.201l4.417,8.602c.328.639-.255,1.366-.951,1.183l-3.994-1.051c-.139-.036-.284-.036-.423,0l-3.994,1.051c-.695.183-1.279-.543-.951-1.183L5.261,1.201c.309-.602,1.169-.602,1.478,0Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default I12px_paperPlane3;