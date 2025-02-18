import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_brush(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px brush";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M15,8V1.75c0-.414-.336-.75-.75-.75h-1.75c-.552,0-1,.448-1,1v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2c0-.552-.448-1-1-1h-3.25c-1.519,0-2.75,1.231-2.75,2.75v4.25H15Z" fill={secondaryfill}/>
		<path d="M3,9.5v.75c0,1.517,1.233,2.75,2.75,2.75h1.604l-.229,3.125c0,1.034,.841,1.875,1.875,1.875s1.875-.841,1.874-1.901l-.216-3.099h1.592c1.517,0,2.75-1.233,2.75-2.75v-.75H3Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_brush;