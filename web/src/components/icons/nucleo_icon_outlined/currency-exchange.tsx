import React from 'react';
import { iconProps } from './iconProps';



function currencyExchange(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px currency exchange";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m16.12,14.695l-.408-2.945h-.002c-1.083,2.64-3.68,4.5-6.71,4.5-4.004,0-7.25-3.246-7.25-7.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m1.88,3.305l.408,2.945h.002C3.373,3.61,5.969,1.75,9,1.75c4.004,0,7.25,3.246,7.25,7.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m5.25,7.75v2.5c0,1.1045,1.679,2,3.75,2s3.75-.8955,3.75-2v-2.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<ellipse cx="9" cy="7.75" fill="none" rx="3.75" ry="2" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default currencyExchange;