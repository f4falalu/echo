import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_gridRectCircle(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px grid rect circle";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" x="2" y="2"/>
		<rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" x="10" y="10"/>
		<circle cx="13" cy="5" fill={secondaryfill} r="3.25"/>
		<circle cx="5" cy="13" fill={secondaryfill} r="3.25"/>
	</g>
</svg>
	);
};

export default 18px_gridRectCircle;