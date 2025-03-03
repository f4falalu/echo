import React from 'react';
import { iconProps } from './iconProps';



function I12px_openInBrowser(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px open in browser";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6 4.75L6 11.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M8.25 6.75L6 4.5 3.75 6.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m8.5,9.25h.75c1.105,0,2-.895,2-2V2.75c0-1.105-.895-2-2-2H2.75C1.645.75.75,1.645.75,2.75v4.5c0,1.105.895,2,2,2h.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="3.25" cy="3.25" fill={fill} r=".75" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default I12px_openInBrowser;