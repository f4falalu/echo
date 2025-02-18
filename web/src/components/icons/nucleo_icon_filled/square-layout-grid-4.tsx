import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function squareLayoutGrid4(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "square layout grid 4";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16,6.5v-1.75c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75v1.75h14Z" fill={secondaryfill}/>
		<path d="M8.25,8H2v5.25c0,1.517,1.233,2.75,2.75,2.75h3.5V8Z" fill={fill}/>
		<path d="M9.75,8v8h3.5c1.517,0,2.75-1.233,2.75-2.75v-5.25h-6.25Z" fill={fill}/>
	</g>
</svg>
	);
};

export default squareLayoutGrid4;