import React from 'react';
import { iconProps } from './iconProps';



function pinTackSlash(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px pin tack slash";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9 16.25L9 12.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9,12.25h5.25c-.089-.699-.318-1.76-.969-2.875-.148-.254-.303-.484-.458-.693" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.25,5.75v-2c0-1.105-.895-2-2-2h-2.5c-1.105,0-2,.895-2,2v4.25c-.329,.347-.697,.801-1.031,1.375-.65,1.115-.88,2.176-.969,2.875h2" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2 16L16 2" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default pinTackSlash;