import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_tableRows2Cols3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px table rows 2 cols 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M12.5,8.25h4.5v-3.5c0-1.517-1.233-2.75-2.75-2.75h-1.75v6.25Z" fill={fill}/>
		<path d="M7 9.75H11V16H7z" fill={secondaryfill}/>
		<path d="M7 2H11V8.25H7z" fill={secondaryfill}/>
		<path d="M12.5,9.75v6.25h1.75c1.517,0,2.75-1.233,2.75-2.75v-3.5h-4.5Z" fill={fill}/>
		<path d="M5.5,9.75H1v3.5c0,1.517,1.233,2.75,2.75,2.75h1.75v-6.25Z" fill={fill}/>
		<path d="M5.5,8.25V2h-1.75c-1.517,0-2.75,1.233-2.75,2.75v3.5H5.5Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_tableRows2Cols3;