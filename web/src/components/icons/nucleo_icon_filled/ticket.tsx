import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function ticket(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "ticket";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.25,7.5c.414,0,.75-.336,.75-.75v-1c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v1c0,.414,.336,.75,.75,.75,.827,0,1.5,.673,1.5,1.5s-.673,1.5-1.5,1.5c-.414,0-.75,.336-.75,.75v1c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-1c0-.414-.336-.75-.75-.75-.827,0-1.5-.673-1.5-1.5s.673-1.5,1.5-1.5Zm-4.25,2.75c0,.414-.336,.75-.75,.75H6.75c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75v2.5Z" fill={fill}/>
	</g>
</svg>
	);
};

export default ticket;