import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function blueprint(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "blueprint";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M15.25,8h-3.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5V3.75c0-.965-.785-1.75-1.75-1.75H7V6.5h1.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-1.25v2.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2H2.75c-.965,0-1.75,.785-1.75,1.75V14.25c0,.965,.785,1.75,1.75,1.75h2.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2H15.25c.965,0,1.75-.785,1.75-1.75v-4.5c0-.965-.785-1.75-1.75-1.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default blueprint;