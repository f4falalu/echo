import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function bedSingle(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "bed single";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.25,7.75c-.414,0-.75-.336-.75-.75V3.75c0-.138-.112-.25-.25-.25H4.75c-.138,0-.25,.112-.25,.25v3.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V3.75c0-.965,.785-1.75,1.75-1.75H13.25c.965,0,1.75,.785,1.75,1.75v3.25c0,.414-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M12,7.5v-1.75c0-.414-.336-.75-.75-.75H6.75c-.414,0-.75,.336-.75,.75v1.75h6Z" fill={secondaryfill}/>
		<path d="M13.25,9H4.75c-1.517,0-2.75,1.233-2.75,2.75v3.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.25H14.5v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.5c0-1.517-1.233-2.75-2.75-2.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default bedSingle;