import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function server(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "server";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.75,2H3.25c-1.241,0-2.25,1.009-2.25,2.25v2c0,1.241,1.009,2.25,2.25,2.25H14.75c1.241,0,2.25-1.009,2.25-2.25v-2c0-1.241-1.009-2.25-2.25-2.25ZM4.25,6c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm2.5,0c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M14.75,9.5H3.25c-1.241,0-2.25,1.009-2.25,2.25v2c0,1.241,1.009,2.25,2.25,2.25H14.75c1.241,0,2.25-1.009,2.25-2.25v-2c0-1.241-1.009-2.25-2.25-2.25ZM4.25,13.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm2.5,0c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default server;