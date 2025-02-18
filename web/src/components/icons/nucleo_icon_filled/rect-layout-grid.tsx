import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function rectLayoutGrid(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "rect layout grid";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M8.5,5.5h8v-.75c0-1.517-1.233-2.75-2.75-2.75h-5.25v3.5Z" fill={fill}/>
		<path d="M8.5 7H16.5V11H8.5z" fill={fill}/>
		<path d="M7,2h-2.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h2.75V2Z" fill={secondaryfill}/>
		<path d="M8.5,12.5v3.5h5.25c1.517,0,2.75-1.233,2.75-2.75v-.75H8.5Z" fill={fill}/>
	</g>
</svg>
	);
};

export default rectLayoutGrid;