import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function mouse2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "mouse 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9.75,1h-1.5C5.631,1,3.5,3.131,3.5,5.75v6.5c0,2.619,2.131,4.75,4.75,4.75h1.5c2.619,0,4.75-2.131,4.75-4.75V5.75c0-2.619-2.131-4.75-4.75-4.75Zm0,6.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5Z" fill={fill}/>
	</g>
</svg>
	);
};

export default mouse2;