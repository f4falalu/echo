import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_chartBarAxisX(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px chart bar axis x";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.25,14.5H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h14.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill}/>
		<rect height="11.5" width="4" fill={fill} rx="1.75" ry="1.75" x="7" y="2"/>
		<rect height="7.5" width="4" fill={fill} rx="1.75" ry="1.75" x="2" y="6"/>
		<rect height="4.5" width="4" fill={fill} rx="1.75" ry="1.75" x="12" y="9"/>
	</g>
</svg>
	);
};

export default 18px_chartBarAxisX;