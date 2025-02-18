import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function barsFilter(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "bars filter";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M12.75,8.25H5.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h7.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill}/>
		<path d="M15.25,3.5H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={fill}/>
		<path d="M10,13h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default barsFilter;