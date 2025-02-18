import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function squareLayoutGrid2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "square layout grid 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M8.25,2h-3.5c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h3.5V2Z" fill={secondaryfill}/>
		<path d="M9.75,8.25h6.25v-3.5c0-1.517-1.233-2.75-2.75-2.75h-3.5v6.25Z" fill={fill}/>
		<path d="M9.75,9.75v6.25h3.5c1.517,0,2.75-1.233,2.75-2.75v-3.5h-6.25Z" fill={fill}/>
	</g>
</svg>
	);
};

export default squareLayoutGrid2;