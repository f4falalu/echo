import React from 'react';
import { iconProps } from './iconProps';



function I12px_tabletMobile(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px tablet mobile";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m8,2.75c0-1.105-.895-2-2-2h-2.75c-1.105,0-2,.895-2,2v4.5c0,1.105.895,2,2,2h1" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="6" width="4" fill="none" rx="1.5" ry="1.5" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="6.75" y="5.25"/>
	</g>
</svg>
	);
};

export default I12px_tabletMobile;