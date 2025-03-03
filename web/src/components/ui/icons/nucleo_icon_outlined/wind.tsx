import React from 'react';
import { iconProps } from './iconProps';



function wind(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px wind";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M2.75,9H13.25c1.105,0,2,.895,2,2s-.895,2-2,2c-.895,0-1.653-.588-1.908-1.399" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2.75,12.25H7c1.105,0,2,.895,2,2s-.895,2-2,2c-.895,0-1.653-.588-1.908-1.399" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2.75,5.75H10.75c1.105,0,2-.895,2-2s-.895-2-2-2c-.895,0-1.653,.588-1.908,1.399" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default wind;