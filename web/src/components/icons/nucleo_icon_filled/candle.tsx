import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function candle(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "candle";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9.485,.179c-.279-.238-.691-.238-.971,0-.206,.175-2.015,1.758-2.015,3.359,0,1.358,1.121,2.462,2.5,2.462s2.5-1.104,2.5-2.462c0-1.601-1.809-3.184-2.015-3.359Z" fill={secondaryfill}/>
		<path d="M10.25,7h-.25v3.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3.75h-.75c-.965,0-1.75,.785-1.75,1.75v6.5c0,.414,.336,.75,.75,.75h4.5c.414,0,.75-.336,.75-.75v-6.5c0-.965-.785-1.75-1.75-1.75Z" fill={fill}/>
		<path d="M15,16.5H3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default candle;