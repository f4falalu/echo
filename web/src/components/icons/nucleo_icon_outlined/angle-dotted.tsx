import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_angleDotted(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px angle dotted";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M2.75,2.75V13.25c0,1.105,.895,2,2,2H15.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="5.429" cy="8.783" fill={secondaryfill} r=".75"/>
		<circle cx="7.7" cy="10.3" fill={secondaryfill} r=".75"/>
		<circle cx="9.217" cy="12.571" fill={secondaryfill} r=".75"/>
	</g>
</svg>
	);
};

export default 18px_angleDotted;