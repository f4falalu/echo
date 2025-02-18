import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 12px_compass(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px compass";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m8.665,3.688l-1.232,2.875c-.168.391-.479.703-.87.87l-2.875,1.232c-.223.096-.448-.13-.353-.353l1.232-2.875c.168-.391.479-.703.87-.87l2.875-1.232c.223-.096.448.13.353.353Z" fill={secondaryfill} strokeWidth="0"/>
		<circle cx="6" cy="6" fill="none" r="5.25" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 12px_compass;