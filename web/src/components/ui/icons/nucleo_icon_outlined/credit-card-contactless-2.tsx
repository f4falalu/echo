import React from 'react';
import { iconProps } from './iconProps';



function creditCardContactless2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px credit card contactless 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M10.768,3.982c-.452-.452-1.077-.732-1.768-.732-.69,0-1.315,.28-1.768,.732" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.536,2.214c-.905-.905-2.155-1.464-3.536-1.464-1.381,0-2.631,.56-3.536,1.464" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M13.5,4.75h.75c1.105,0,2,.895,2,2v7.5c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V6.75c0-1.105,.895-2,2-2h.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M1.75 8.75L16.25 8.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M4.25 13.25L7.25 13.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.75 13.25L13.75 13.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="9" cy="5.75" fill={secondaryfill} r=".75"/>
	</g>
</svg>
	);
};

export default creditCardContactless2;