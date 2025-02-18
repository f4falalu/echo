import React from 'react';
import { iconProps } from './iconProps';



function headphones2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px headphones 2";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m1.25,6.75v-.75C1.25,3.377,3.377,1.25,6,1.25h0c2.623,0,4.75,2.127,4.75,4.75v.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m1.25,6.75h2c.552,0,1,.448,1,1v2c0,.552-.448,1-1,1h-1c-.552,0-1-.448-1-1v-3h0Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m8.75,6.75h1c.552,0,1,.448,1,1v2c0,.552-.448,1-1,1h-2v-3c0-.552.448-1,1-1Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} transform="rotate(180 9.25 8.75)"/>
	</g>
</svg>
	);
};

export default headphones2;