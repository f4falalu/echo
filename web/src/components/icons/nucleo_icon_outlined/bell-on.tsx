import React from 'react';
import { iconProps } from './iconProps';



function bellOn(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px bell on";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M1.906,5c.308-1.457,1.054-2.754,2.094-3.745" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M16.094,5c-.308-1.457-1.054-2.754-2.094-3.745" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M15.75,13.25c-1.105,0-2-.895-2-2V6.5c0-2.623-2.127-4.75-4.75-4.75h0c-2.623,0-4.75,2.127-4.75,4.75v4.75c0,1.105-.895,2-2,2H15.75Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.588,15.185c-.095-.117-.237-.185-.388-.185h-2.399c-.151,0-.293,.068-.388,.185-.095,.117-.132,.271-.101,.418,.173,.822,.868,1.397,1.689,1.397s1.516-.575,1.689-1.397c.031-.147-.006-.301-.101-.418Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default bellOn;