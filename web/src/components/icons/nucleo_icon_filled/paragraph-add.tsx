import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function paragraphAdd(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "paragraph add";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M15.25,12h-2.25v-2.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.25h-2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.25v2.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.25h2.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill}/>
		<path d="M6.25,14.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M6.25,11H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M15.25,7.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M15.25,4H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default paragraphAdd;