import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function bed(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "bed";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M17,12v-3.25c0-1.517-1.233-2.75-2.75-2.75h-5.5c-.414,0-.75,.336-.75,.75v5.25h9Z" fill={secondaryfill}/>
		<path d="M16.25,11.5H2.5V3.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V14.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75H15.5v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75Z" fill={fill}/>
		<circle cx="5.25" cy="8.75" fill={fill} r="1.75"/>
	</g>
</svg>
	);
};

export default bed;