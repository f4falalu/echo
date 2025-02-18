import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function squareLayoutGrid6(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "square layout grid 6";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M7 2H11V5.5H7z" fill={secondaryfill}/>
		<path d="M2 7H5.5V11H2z" fill={secondaryfill}/>
		<path d="M12.5 7H16V11H12.5z" fill={secondaryfill}/>
		<path d="M7 12.5H11V16H7z" fill={secondaryfill}/>
		<path d="M7 7H11V11H7z" fill={fill}/>
		<path d="M5.5,12.5H2v.75c0,1.517,1.233,2.75,2.75,2.75h.75v-3.5Z" fill={fill}/>
		<path d="M12.5,5.5h3.5v-.75c0-1.517-1.233-2.75-2.75-2.75h-.75v3.5Z" fill={fill}/>
		<path d="M12.5,12.5v3.5h.75c1.517,0,2.75-1.233,2.75-2.75v-.75h-3.5Z" fill={fill}/>
		<path d="M5.5,5.5V2h-.75c-1.517,0-2.75,1.233-2.75,2.75v.75h3.5Z" fill={fill}/>
	</g>
</svg>
	);
};

export default squareLayoutGrid6;