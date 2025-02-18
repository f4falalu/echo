import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function tableRowsMinus2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "table rows minus 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M1 7H17V11H1z" fill={fill}/>
		<path d="M17,5.5v-.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17Z" fill={fill}/>
		<path d="M10,14.25c0-.71,.338-1.337,.853-1.75H1v.75c0,1.517,1.233,2.75,2.75,2.75h7.103c-.516-.413-.853-1.04-.853-1.75Z" fill={fill}/>
		<path d="M17.25,13.5h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default tableRowsMinus2;