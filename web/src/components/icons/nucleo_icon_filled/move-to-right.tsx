import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_moveToRight(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px move to right";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="14" width="7" fill={fill} rx="2.75" ry="2.75" x="10" y="2"/>
		<path d="M5.75,3.5c.414,0,.75,.336,.75,.75v.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.75c0-1.241-1.009-2.25-2.25-2.25-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z" fill={secondaryfill}/>
		<path d="M7.25,7c-.414,0-.75,.336-.75,.75v2.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75Z" fill={secondaryfill}/>
		<path d="M5.75,16c1.241,0,2.25-1.009,2.25-2.25v-.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.75c0,.414-.336,.75-.75,.75s-.75,.336-.75,.75,.336,.75,.75,.75Z" fill={secondaryfill}/>
		<path d="M1.75,5.75c.414,0,.75-.336,.75-.75v-.75c0-.414,.336-.75,.75-.75s.75-.336,.75-.75-.336-.75-.75-.75c-1.241,0-2.25,1.009-2.25,2.25v.75c0,.414,.336,.75,.75,.75Z" fill={secondaryfill}/>
		<path d="M1.75,11c.414,0,.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.5c0,.414,.336,.75,.75,.75Z" fill={secondaryfill}/>
		<path d="M4,15.25c0-.414-.336-.75-.75-.75s-.75-.336-.75-.75v-.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.75c0,1.241,1.009,2.25,2.25,2.25,.414,0,.75-.336,.75-.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default 18px_moveToRight;