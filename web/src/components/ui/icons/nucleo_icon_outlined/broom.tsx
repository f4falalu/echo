import React from 'react';
import { iconProps } from './iconProps';



function broom(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px broom";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6.096,7.032c.488,.791,1.111,1.636,1.904,2.468,1.074,1.125,2.194,1.948,3.204,2.546" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M16.25 1.5L10.376 7.374" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.376,7.374c3.158,2.77-.077,6.653-2.123,8.288-.51,.408-1.186,.554-1.814,.375-2.745-.781-4.391-3.076-4.689-6.037,1.375-.188,2.192-.997,3.447-2.268,1.56-1.581,3.803-1.566,5.179-.358Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default broom;