import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function borderTopRight(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "border top right";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="15.25" fill={fill} r=".75"/>
		<circle cx="9" cy="12.125" fill={fill} r=".75"/>
		<circle cx="9" cy="9" fill={fill} r=".75"/>
		<circle cx="9" cy="5.875" fill={fill} r=".75"/>
		<circle cx="12.125" cy="9" fill={fill} r=".75"/>
		<circle cx="5.875" cy="9" fill={fill} r=".75"/>
		<circle cx="2.75" cy="9" fill={fill} r=".75"/>
		<circle cx="12.125" cy="15.25" fill={fill} r=".75"/>
		<circle cx="5.875" cy="15.25" fill={fill} r=".75"/>
		<circle cx="2.75" cy="15.25" fill={fill} r=".75"/>
		<circle cx="2.75" cy="12.125" fill={fill} r=".75"/>
		<circle cx="2.75" cy="5.875" fill={fill} r=".75"/>
		<path d="M15.25,2H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.5V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default borderTopRight;