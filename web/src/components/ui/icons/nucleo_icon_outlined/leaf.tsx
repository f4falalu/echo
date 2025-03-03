import React from 'react';
import { iconProps } from './iconProps';



function leaf(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px leaf";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m9.8997,15.1642c4.9614-.879,6.1773-8.293,3.3653-13.4142-1.709,3.571-5.652,3.034-7.858,5.754-.654.806-1.158,1.901-1.158,3.082,0,1.577.779,2.972,1.972,3.816" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m2.75,16.25s4.598-1.265,7.5-6.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default leaf;