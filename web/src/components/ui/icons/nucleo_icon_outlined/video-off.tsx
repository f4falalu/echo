import React from 'react';
import { iconProps } from './iconProps';



function videoOff(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px video off";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M3.75,14.25c-1.105,0-2-.895-2-2V5.75c0-1.105,.895-2,2-2h6.5c1.105,0,2,.895,2,2" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M15.106,6.429l1.403-.772c.333-.183,.741,.058,.741,.438v5.809c0,.38-.408,.621-.741,.438l-4.259-2.342v2.25c0,1.105-.895,2-2,2h-2.965" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2 16L16 2" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="4.75" cy="6.75" fill={secondaryfill} r=".75"/>
	</g>
</svg>
	);
};

export default videoOff;