import React from 'react';
import { iconProps } from './iconProps';



function refresh(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px refresh";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M5.25 9.5L3 7.25 0.75 9.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M13.762,13.048c-1.146,1.347-2.855,2.202-4.762,2.202-3.452,0-6.25-2.798-6.25-6.25,0-.597,.084-1.175,.24-1.722" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.75 8.5L15 10.75 17.25 8.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M4.238,4.952c1.146-1.347,2.855-2.202,4.762-2.202,3.452,0,6.25,2.798,6.25,6.25,0,.579-.079,1.14-.226,1.672" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default refresh;