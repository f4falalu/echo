import React from 'react';
import { iconProps } from './iconProps';



function waterSurface(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px water surface";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M1.75,14.25c1.4,.004,2.729-.616,3.625-1.692,1.678,2.002,4.661,2.265,6.663,.587,.212-.178,.409-.374,.587-.587,.894,1.078,2.224,1.699,3.625,1.692" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M1.75,9.846c1.4,.004,2.729-.616,3.625-1.692,1.678,2.002,4.661,2.265,6.663,.587,.212-.178,.409-.374,.587-.587,.894,1.078,2.224,1.699,3.625,1.692" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M1.75,5.442c1.4,.004,2.729-.616,3.625-1.692,.897,1.075,2.225,1.695,3.625,1.692,1.401,.007,2.731-.613,3.625-1.692,.894,1.078,2.224,1.699,3.625,1.692" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default waterSurface;