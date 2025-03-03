import React from 'react';
import { iconProps } from './iconProps';



function hexagons(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px hexagons";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6.75,6.75v4.271c0,.536,.286,1.031,.75,1.299l3.5,2.021c.464,.268,1.036,.268,1.5,0l3.5-2.021c.464-.268,.75-.763,.75-1.299V6.979c0-.536-.286-1.031-.75-1.299l-3.5-2.021c-.261-.151-.557-.217-.848-.198" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.25,11.25V6.979c0-.536-.286-1.031-.75-1.299l-3.5-2.021c-.464-.268-1.036-.268-1.5,0l-3.5,2.021c-.464,.268-.75,.763-.75,1.299v4.041c0,.536,.286,1.031,.75,1.299l3.5,2.021c.261,.151,.557,.217,.848,.198" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default hexagons;