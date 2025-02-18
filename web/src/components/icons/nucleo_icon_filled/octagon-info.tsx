import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function octagonInfo(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "octagon info";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M15.694,5.088l-2.782-2.782c-.52-.52-1.21-.806-1.945-.806h-3.935c-.735,0-1.425,.286-1.945,.806l-2.782,2.782c-.52,.52-.806,1.21-.806,1.945v3.935c0,.735,.286,1.425,.806,1.945l2.782,2.782c.52,.52,1.21,.806,1.945,.806h3.935c.735,0,1.425-.286,1.945-.806l2.782-2.782c.52-.52,.806-1.21,.806-1.945v-3.935c0-.735-.286-1.425-.806-1.945Zm-5.944,7.731c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-4.569c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.569Zm-.75-6.069c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Z" fill={fill}/>
	</g>
</svg>
	);
};

export default octagonInfo;