import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_chartRadar(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px chart radar";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M7.912,2.133L2.904,6.154c-.532,.427-.767,1.126-.602,1.79l1.49,5.981c.194,.779,.891,1.325,1.69,1.325h7.036c.799,0,1.496-.546,1.69-1.325l1.49-5.981c.165-.663-.07-1.363-.602-1.79L10.088,2.133c-.636-.511-1.54-.511-2.177,0Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9 5.75L5 8 6.733 12.25 11.017 11.259 12.25 8 9 5.75z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_chartRadar;