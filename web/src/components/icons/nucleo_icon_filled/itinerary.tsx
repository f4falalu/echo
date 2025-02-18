import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function itinerary(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "itinerary";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="5.5" width="5.5" fill={fill} rx="1.75" ry="1.75" x="2" y="1.5"/>
		<rect height="5.5" width="5.5" fill={fill} rx="1.75" ry="1.75" x="10.5" y="11"/>
		<path d="M12.875,3.5h-3.375c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.375c.896,0,1.625,.729,1.625,1.625s-.729,1.625-1.625,1.625H5.125c-1.723,0-3.125,1.402-3.125,3.125s1.402,3.125,3.125,3.125h3.375c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-3.375c-.896,0-1.625-.729-1.625-1.625s.729-1.625,1.625-1.625h7.75c1.723,0,3.125-1.402,3.125-3.125s-1.402-3.125-3.125-3.125Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default itinerary;