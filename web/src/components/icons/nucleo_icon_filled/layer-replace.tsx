import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function layerReplace(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "layer replace";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="9.5" width="9.5" fill={fill} rx="2.25" ry="2.25" x="7" y="7"/>
		<path d="M5.25,9.5h-1.5c-.413,0-.75-.336-.75-.75V3.75c0-.414,.337-.75,.75-.75h5c.413,0,.75,.336,.75,.75v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5c0-1.241-1.01-2.25-2.25-2.25H3.75c-1.24,0-2.25,1.009-2.25,2.25v5c0,1.241,1.01,2.25,2.25,2.25h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={fill}/>
		<path d="M5.25,15c-1.24,0-2.25-1.009-2.25-2.25,0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,2.068,1.683,3.75,3.75,3.75,.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill}/>
		<path d="M12.75,3c1.24,0,2.25,1.009,2.25,2.25,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-2.068-1.683-3.75-3.75-3.75-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default layerReplace;