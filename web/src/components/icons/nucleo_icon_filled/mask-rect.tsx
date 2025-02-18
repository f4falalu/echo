import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function maskRect(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "mask rect";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M5.25,13H2.75c-.965,0-1.75-.785-1.75-1.75V6.75c0-.965,.785-1.75,1.75-1.75h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H2.75c-.138,0-.25,.112-.25,.25v4.5c0,.138,.112,.25,.25,.25h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M14.75,1h-6c-.965,0-1.75,.785-1.75,1.75V15.25c0,.965,.785,1.75,1.75,1.75h6c.965,0,1.75-.785,1.75-1.75V2.75c0-.965-.785-1.75-1.75-1.75Zm.25,14.25c0,.138-.112,.25-.25,.25h-6c-.138,0-.25-.112-.25-.25v-2.25h2.75c.965,0,1.75-.785,1.75-1.75V6.75c0-.965-.785-1.75-1.75-1.75h-2.75V2.75c0-.138,.112-.25,.25-.25h6c.138,0,.25,.112,.25,.25V15.25Z" fill={fill}/>
	</g>
</svg>
	);
};

export default maskRect;