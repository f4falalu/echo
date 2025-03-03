import React from 'react';
import { iconProps } from './iconProps';



function moveObjDown2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px move obj down 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M10.25 12.75L12.75 15.25 15.25 12.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.75 15.25L12.75 2.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2.75,6.5v.25c0,.552,.448,1,1,1h.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M4,2.75h-.25c-.552,0-1,.448-1,1v.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M7.75,4v-.25c0-.552-.448-1-1-1h-.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6.5,7.75h.25c.552,0,1-.448,1-1v-.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="5" width="5" fill="none" rx="1" ry="1" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="2.75" y="10.25"/>
	</g>
</svg>
	);
};

export default moveObjDown2;