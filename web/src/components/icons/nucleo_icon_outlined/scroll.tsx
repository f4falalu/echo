import React from 'react';
import { iconProps } from './iconProps';



function scroll(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px scroll";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M3.25,2.25h0c-.828,0-1.5,.672-1.5,1.5v2c0,.552,.448,1,1,1h2" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3.25,2.25H12.75c.828,0,1.5,.672,1.5,1.5v6.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6.25,15.75c-.828,0-1.5-.672-1.5-1.5V3.75c0-.828-.672-1.5-1.5-1.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M14.75,15.75c.828,0,1.5-.672,1.5-1.5v-1c0-.276-.224-.5-.5-.5h-7.5c-.276,0-.5,.224-.5,.5v1c0,.828-.672,1.5-1.5,1.5H14.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default scroll;