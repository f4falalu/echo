import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_dice6(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px dice 6";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="12.5" width="12.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="2.75" y="2.75"/>
		<circle cx="6.5" cy="12.25" fill={secondaryfill} r="1"/>
		<circle cx="6.5" cy="9" fill={secondaryfill} r="1"/>
		<circle cx="6.5" cy="5.75" fill={secondaryfill} r="1"/>
		<circle cx="11.5" cy="12.25" fill={secondaryfill} r="1"/>
		<circle cx="11.5" cy="9" fill={secondaryfill} r="1"/>
		<circle cx="11.5" cy="5.75" fill={secondaryfill} r="1"/>
	</g>
</svg>
	);
};

export default 18px_dice6;