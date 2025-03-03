import React from 'react';
import { iconProps } from './iconProps';



function drinkSlash(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px drink slash";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M11.141,6.862c-.234-.085-.391-.112-.391-.112V2.25c0-.552-.448-1-1-1h-1.5c-.552,0-1,.448-1,1V6.75s-2.5,.438-2.5,3.25v5.75c0,.552,.448,1,1,1h6.5c.552,0,1-.448,1-1v-5.75c0-.55-.096-1.01-.25-1.393" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9.25 12L9.25 14.25 4.75 14.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M4.75 9.75L8.25 9.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M7.25 4.75L10.75 4.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2 16L16 2" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default drinkSlash;