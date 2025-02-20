import React from 'react';
import { iconProps } from './iconProps';



function I12px_laptop(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px laptop";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m3.25,9.75c-.828,0-1.5-.672-1.5-1.5V3.25c0-.828.672-1.5,1.5-1.5h5.5c.828,0,1.5.672,1.5,1.5v5c0,.828-.672,1.5-1.5,1.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M0.75 9.75L11.25 9.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default I12px_laptop;