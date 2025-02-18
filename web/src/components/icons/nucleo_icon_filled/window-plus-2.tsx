import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function windowPlus2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "window plus 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m9.25,14.5H3.75c-.689,0-1.25-.561-1.25-1.25v-5.25h13v2.501c0,.414.336.75.75.75s.75-.336.75-.75v-5.751c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v8.5c0,1.517,1.233,2.75,2.75,2.75h5.5c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Zm-2.25-10.5c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Zm-3,0c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Z" fill={fill} strokeWidth="0"/>
		<path d="m16.75,14h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v1.75h-1.75c-.414,0-.75.336-.75.75s.336.75.75.75h1.75v1.75c0,.414.336.75.75.75s.75-.336.75-.75v-1.75h1.75c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default windowPlus2;