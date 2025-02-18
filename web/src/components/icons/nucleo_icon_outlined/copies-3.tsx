import React from 'react';
import { iconProps } from './iconProps';



function copies3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px copies 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="8.5" width="8.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="1.75" y="1.75"/>
		<path d="M12.721,5.394c.329,.356,.529,.833,.529,1.356v4.5c0,1.105-.895,2-2,2H6.75c-.523,0-.999-.201-1.356-.529" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M15.721,8.394c.329,.356,.529,.833,.529,1.356v4.5c0,1.105-.895,2-2,2h-4.5c-.523,0-.999-.201-1.356-.529" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default copies3;