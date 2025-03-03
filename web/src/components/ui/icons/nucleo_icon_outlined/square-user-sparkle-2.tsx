import React from 'react';
import { iconProps } from './iconProps';



function squareUserSparkle2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px square user sparkle 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="7.75" fill="none" r="2" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M5.126,15.25c.444-1.725,2.01-3,3.874-3s3.43,1.275,3.874,3" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.266,2.75H4.75c-1.105,0-2,.896-2,2V13.25c0,1.104,.895,2,2,2H13.25c1.105,0,2-.896,2-2V7.688" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M17.589,2.388l-1.515-.506-.505-1.515c-.164-.49-.975-.49-1.139,0l-.505,1.515-1.515,.506c-.245,.081-.41,.311-.41,.569s.165,.488,.41,.569l1.515,.506,.505,1.515c.082,.245,.312,.41,.57,.41s.487-.165,.57-.41l.505-1.515,1.515-.506c.245-.081,.41-.311,.41-.569s-.165-.487-.41-.569h0Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default squareUserSparkle2;