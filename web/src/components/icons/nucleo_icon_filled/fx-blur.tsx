import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function fxBlur(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "fx blur";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="6.5" cy="2" fill={secondaryfill} r="1"/>
		<circle cx="11.5" cy="2" fill={secondaryfill} r="1"/>
		<circle cx="16" cy="6.5" fill={secondaryfill} r="1"/>
		<circle cx="16" cy="11.5" fill={secondaryfill} r="1"/>
		<circle cx="11.5" cy="16" fill={secondaryfill} r="1"/>
		<circle cx="6.5" cy="16" fill={secondaryfill} r="1"/>
		<circle cx="2" cy="11.5" fill={secondaryfill} r="1"/>
		<circle cx="2" cy="6.5" fill={secondaryfill} r="1"/>
		<circle cx="6.5" cy="6.5" fill={fill} r="2"/>
		<circle cx="11.5" cy="6.5" fill={fill} r="2"/>
		<circle cx="6.5" cy="11.5" fill={fill} r="2"/>
		<circle cx="11.5" cy="11.5" fill={fill} r="2"/>
	</g>
</svg>
	);
};

export default fxBlur;