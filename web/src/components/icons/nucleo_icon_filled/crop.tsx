import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_crop(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px crop";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M13.25,17c-.414,0-.75-.336-.75-.75V5.75c0-.138-.112-.25-.25-.25H7.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5c.965,0,1.75,.785,1.75,1.75v10.5c0,.414-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M4.75,5.5H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M16.25,14H5.75c-.965,0-1.75-.785-1.75-1.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V12.25c0,.138,.112,.25,.25,.25h10.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_crop;