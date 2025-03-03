import React from 'react';
import { iconProps } from './iconProps';



function envelopeOpenCheck(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px envelope open check";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M1.75,6.75c0-.728,.396-1.361,1.034-1.713L8.517,1.874c.301-.166,.665-.166,.966,0l5.733,3.163c.638,.352,1.034,.984,1.034,1.713" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M16.25,9.464v-2.714l-6.815,3.29c-.275,.133-.595,.133-.87,0L1.75,6.75v6.5c0,1.104,.895,2,2,2h6.056" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.25 14.75L13.859 16.25 17.256 11.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default envelopeOpenCheck;