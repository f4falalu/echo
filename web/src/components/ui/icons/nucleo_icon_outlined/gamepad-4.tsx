import React from 'react';
import { iconProps } from './iconProps';



function gamepad4(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px gamepad 4";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="5.625" cy="7.25" fill={secondaryfill} r="1.25"/>
		<circle cx="4.75" cy="13.25" fill={secondaryfill} r=".75"/>
		<circle cx="6.25" cy="11.75" fill={secondaryfill} r=".75"/>
		<circle cx="12.375" cy="10.75" fill={secondaryfill} r="1.25"/>
		<circle cx="13.25" cy="4.75" fill={secondaryfill} r=".75"/>
		<circle cx="11.75" cy="6.25" fill={secondaryfill} r=".75"/>
		<path d="M9,16.25h-3.75c-1.657,0-3-1.343-3-3V6.75c0-1.657,1.343-3,3-3h3.75v12.5Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9,3.75V1.75s3.75,0,3.75,0c1.657,0,3,1.343,3,3v6.5c0,1.657-1.343,3-3,3h-3.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default gamepad4;