import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function garage(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "garage";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M7 14H11V16H7z" fill={secondaryfill}/>
		<path d="M7 10.5H11V12.5H7z" fill={secondaryfill}/>
		<path d="M15.273,8.277l-6.273-3.028-6.271,3.028c-.228,.11-.477,.167-.729,.196v4.778c0,1.517,1.233,2.75,2.75,2.75h.75v-6.25c0-.414,.336-.75,.75-.75h5.5c.414,0,.75,.336,.75,.75v6.25h.75c1.517,0,2.75-1.233,2.75-2.75v-4.778c-.25-.028-.496-.084-.727-.195Z" fill={fill}/>
		<path d="M16.249,7c-.109,0-.22-.024-.325-.075l-6.924-3.342L2.076,6.925c-.374,.181-.821,.024-1.002-.349-.18-.373-.023-.821,.35-1.001l7.25-3.5c.207-.1,.445-.1,.652,0l7.25,3.5c.373,.18,.529,.628,.35,1.001-.13,.268-.397,.424-.677,.424Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default garage;