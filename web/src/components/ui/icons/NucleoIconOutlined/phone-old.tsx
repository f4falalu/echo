import React from 'react';
import { iconProps } from './iconProps';



function phoneOld(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px phone old";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="13.5" width="7.5" fill="none" rx="1" ry="1" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="5.25" y="3.75"/>
		<circle cx="7.75" cy="11.75" fill={secondaryfill} r=".75"/>
		<circle cx="10.25" cy="11.75" fill={secondaryfill} r=".75"/>
		<circle cx="7.75" cy="14.25" fill={secondaryfill} r=".75"/>
		<circle cx="10.25" cy="14.25" fill={secondaryfill} r=".75"/>
		<path d="M10.75 0.75L10.75 3.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M7.75 8.25H10.25V9.25H7.75z" fill={secondaryfill} stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default phoneOld;