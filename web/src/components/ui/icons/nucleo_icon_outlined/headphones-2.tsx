import React from 'react';
import { iconProps } from './iconProps';



function headphones2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px headphones 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M15.25,9.75v-.75c0-3.452-2.798-6.25-6.25-6.25h0c-3.452,0-6.25,2.798-6.25,6.25v.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2.75,9.75v4.5c0,.552,.448,1,1,1h1.5c.552,0,1-.448,1-1v-3.5c0-.552-.448-1-1-1h-1.547s-.953,0-.953,0Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M15.25,9.75v4.5c0,.552-.448,1-1,1h-1.5c-.552,0-1-.448-1-1v-3.5c0-.552,.448-1,1-1h1.547s.953,0,.953,0Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default headphones2;