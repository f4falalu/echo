import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_borderRight(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px border right";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M15.25 15.25L15.25 2.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="9" cy="15.25" fill={fill} r=".75"/>
		<circle cx="9" cy="12.125" fill={fill} r=".75"/>
		<circle cx="9" cy="9" fill={fill} r=".75"/>
		<circle cx="9" cy="5.875" fill={fill} r=".75"/>
		<circle cx="9" cy="2.75" fill={fill} r=".75"/>
		<circle cx="12.125" cy="9" fill={fill} r=".75"/>
		<circle cx="5.875" cy="9" fill={fill} r=".75"/>
		<circle cx="2.75" cy="9" fill={fill} r=".75"/>
		<circle cx="12.125" cy="2.75" fill={fill} r=".75"/>
		<circle cx="5.875" cy="2.75" fill={fill} r=".75"/>
		<circle cx="2.75" cy="2.75" fill={fill} r=".75"/>
		<circle cx="12.125" cy="15.25" fill={fill} r=".75"/>
		<circle cx="5.875" cy="15.25" fill={fill} r=".75"/>
		<circle cx="2.75" cy="15.25" fill={fill} r=".75"/>
		<circle cx="2.75" cy="12.125" fill={fill} r=".75"/>
		<circle cx="2.75" cy="5.875" fill={fill} r=".75"/>
	</g>
</svg>
	);
};

export default 18px_borderRight;