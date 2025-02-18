import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_humidity(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px humidity";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M2,9.75c1.521,0,2-1.5,3.5-1.5s2.021,1.5,3.5,1.5c1.542,0,2.042-1.5,3.5-1.5s2.021,1.5,3.5,1.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2,5.75c1.521,0,2-1.5,3.5-1.5s2.021,1.5,3.5,1.5c1.542,0,2.042-1.5,3.5-1.5s2.021,1.5,3.5,1.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2,13.75c1.521,0,2-1.5,3.5-1.5s2.021,1.5,3.5,1.5c1.542,0,2.042-1.5,3.5-1.5s2.021,1.5,3.5,1.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_humidity;