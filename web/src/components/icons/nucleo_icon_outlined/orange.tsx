import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_orange(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px orange";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M11.5,0h0C11.776,0,12,.224,12,.5h0c0,1.38-1.12,2.5-2.5,2.5h0c-.276,0-.5-.224-.5-.5h0C9,1.12,10.12,0,11.5,0Z" fill={secondaryfill}/>
		<circle cx="9" cy="13.25" fill={secondaryfill} r=".75"/>
		<circle cx="11.25" cy="11.75" fill={secondaryfill} r=".75"/>
		<circle cx="6.75" cy="11.75" fill={secondaryfill} r=".75"/>
		<circle cx="9" cy="10.5" fill="none" r="5.75" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_orange;