import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function sliders3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "sliders 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M15.75,8.25h-1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill}/>
		<path d="M2.25,9.75H11v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V7c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.25H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z" fill={secondaryfill}/>
		<path d="M15.75,3.5h-6.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={fill}/>
		<path d="M2.25,5h3.25v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.25H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z" fill={fill}/>
		<path d="M15.75,13h-6.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={fill}/>
		<path d="M6.25,11c-.414,0-.75,.336-.75,.75v1.25H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.25v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-4c0-.414-.336-.75-.75-.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default sliders3;