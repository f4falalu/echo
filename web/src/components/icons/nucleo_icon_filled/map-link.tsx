import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_mapLink(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px map link";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M12.75,17.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.5c-.413,0-.75-.336-.75-.75v-1c0-.414,.337-.75,.75-.75h.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.5c-1.24,0-2.25,1.009-2.25,2.25v1c0,1.241,1.01,2.25,2.25,2.25h.5Z" fill={secondaryfill}/>
		<path d="M8.5,14.25c0-2.068,1.683-3.75,3.75-3.75h3.5c.44,0,.857,.09,1.25,.23V4.997c0-.534-.238-1.031-.655-1.365-.416-.334-.953-.459-1.474-.343l-3.001,.666c-.047,.01-.095,.007-.138-.009l-4.953-1.802c-.315-.113-.649-.136-.977-.062l-3.432,.762c-.808,.179-1.371,.882-1.371,1.708V13.003c0,.534,.238,1.031,.655,1.365,.416,.334,.953,.46,1.474,.343l3.001-.666c.047-.01,.095-.007,.138,.009l2.232,.812v-.616Z" fill={fill}/>
		<path d="M15.75,12h-.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.5c.413,0,.75,.336,.75,.75v1c0,.414-.337,.75-.75,.75h-.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.5c1.24,0,2.25-1.009,2.25-2.25v-1c0-1.241-1.01-2.25-2.25-2.25Z" fill={secondaryfill}/>
		<path d="M12.5,14.75c0,.414,.336,.75,.75,.75h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.5c-.414,0-.75,.336-.75,.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default 18px_mapLink;