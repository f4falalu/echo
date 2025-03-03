import React from 'react';
import { iconProps } from './iconProps';



function nut(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px nut";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="9" fill="none" r="2.25" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.473,2.75H6.527c-.713,0-1.372,.38-1.73,.997L2.332,7.997c-.36,.621-.36,1.386,0,2.007l2.465,4.25c.358,.617,1.017,.997,1.73,.997h4.946c.713,0,1.372-.38,1.73-.997l2.465-4.25c.36-.621,.36-1.386,0-2.007l-2.465-4.25c-.358-.617-1.017-.997-1.73-.997Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default nut;