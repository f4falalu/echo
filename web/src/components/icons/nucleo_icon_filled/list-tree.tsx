import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function listTree(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "list tree";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" x="9" y="2"/>
		<rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" x="9" y="10"/>
		<path d="M5.25,6h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2c-.413,0-.75-.336-.75-.75V1.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V11.75c0,1.241,1.01,2.25,2.25,2.25h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2c-.413,0-.75-.336-.75-.75V5.862c.236,.084,.486,.138,.75,.138Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default listTree;