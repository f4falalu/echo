import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function circles4(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "circles 4";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,15.5c-3.584,0-6.5-2.916-6.5-6.5,0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,4.411,3.589,8,8,8,.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill}/>
		<path d="M9,1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75c3.584,0,6.5,2.916,6.5,6.5,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-4.411-3.589-8-8-8Z" fill={secondaryfill}/>
		<circle cx="9" cy="9" fill={fill} r="5"/>
	</g>
</svg>
	);
};

export default circles4;