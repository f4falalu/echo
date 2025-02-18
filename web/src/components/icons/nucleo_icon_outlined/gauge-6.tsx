import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_gauge6(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px gauge 6";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="4.75" fill={fill} r=".75"/>
		<circle cx="12.005" cy="5.995" fill={fill} r=".75"/>
		<circle cx="13.25" cy="9" fill={fill} r=".75"/>
		<circle cx="5.995" cy="5.995" fill={fill} r=".75"/>
		<path d="M4.75,9.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z" fill={fill}/>
		<path d="M12.968,15.063c1.975-1.295,3.282-3.525,3.282-6.063,0-4.004-3.246-7.25-7.25-7.25S1.75,4.996,1.75,9c0,2.538,1.307,4.768,3.282,6.063" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M7.5,14.75c0-.828,1.5-7,1.5-7,0,0,1.5,6.172,1.5,7s-.672,1.5-1.5,1.5-1.5-.672-1.5-1.5Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_gauge6;