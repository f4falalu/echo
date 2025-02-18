import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_rectLayoutGrid3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px rect layout grid 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M17,6.5v-1.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v1.75H17Z" fill={secondaryfill}/>
		<path d="M7,8v8h7.25c1.517,0,2.75-1.233,2.75-2.75v-5.25H7Z" fill={fill}/>
		<path d="M5.5,8H1v5.25c0,1.517,1.233,2.75,2.75,2.75h1.75V8Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_rectLayoutGrid3;