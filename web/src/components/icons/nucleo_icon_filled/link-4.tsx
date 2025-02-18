import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function link4(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "link 4";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M12.25,8c-.414,0-.75-.336-.75-.75v-2.25c0-1.378-1.121-2.5-2.5-2.5s-2.5,1.122-2.5,2.5v2.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.25c0-2.206,1.794-4,4-4s4,1.794,4,4v2.25c0,.414-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M9,17c-2.206,0-4-1.794-4-4v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25c0,1.378,1.121,2.5,2.5,2.5s2.5-1.122,2.5-2.5v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25c0,2.206-1.794,4-4,4Z" fill={fill}/>
		<path d="M9,12c-.414,0-.75-.336-.75-.75V6.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.5c0,.414-.336,.75-.75,.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default link4;