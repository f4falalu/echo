import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_mobileWave(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px mobile wave";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.25,11.25v3c0,1.105-.895,2-2,2H5.75c-1.105,0-2-.895-2-2v-2.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3.75,6.75V3.75c0-1.105,.895-2,2-2h6.5c1.105,0,2,.895,2,2v2.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M1,9.25H5.25c.552,0,1-.448,1-1v-1.625c0-.759,.616-1.375,1.375-1.375h0c.759,0,1.375,.616,1.375,1.375v4.75c0,.759,.616,1.375,1.375,1.375h0c.759,0,1.375-.616,1.375-1.375v-1.625c0-.552,.448-1,1-1h4.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_mobileWave;