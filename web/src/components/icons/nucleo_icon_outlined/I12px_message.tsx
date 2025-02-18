import React from 'react';
import { iconProps } from './iconProps';



function message(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px message";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m9.25,8.75h-2.5l-3,2.5v-2.5h-1c-1.105,0-2-.895-2-2v-3.5c0-1.105.895-2,2-2h6.5c1.105,0,2,.895,2,2v3.5c0,1.105-.895,2-2,2Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default message;