import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_heightMax(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px height max";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.5,15.75c0,.414-.336,.75-.75,.75h-5.25c-.414,0-.75-.336-.75-.75,0-.414,.336-.75,.75-.75h5.25c.414,0,.75,.336,.75,.75Z" fill={secondaryfill}/>
		<path d="M16.5,2.25c0,.414-.336,.75-.75,.75h-5.25c-.414,0-.75-.336-.75-.75,0-.414,.336-.75,.75-.75h5.25c.414,0,.75,.336,.75,.75Z" fill={secondaryfill}/>
		<path d="M15.78,6.22c.293,.293,.293,.768,0,1.061s-.768,.293-1.061,0l-.72-.72v6.689c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V6.561s-.72,.72-.72,.72c-.293,.293-.768,.293-1.061,0-.146-.146-.22-.338-.22-.53,0-.192,.073-.384,.22-.53l2-2c.293-.293,.768-.293,1.061,0l2,2Z" fill={secondaryfill}/>
		<path d="M8.5,3.25V14.75c0,.965-.785,1.75-1.75,1.75H3.75c-.965,0-1.75-.785-1.75-1.75v-1.25s1.5,0,1.5,0c.414,0,.75-.336,.75-.75,0-.414-.336-.75-.75-.75h-1.5s0-1,0-1h2.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2s0-1,0-1h1.5c.414,0,.75-.336,.75-.75,0-.414-.336-.75-.75-.75H2s0-1,0-1h2.5c.414,0,.75-.336,.75-.75,0-.414-.336-.75-.75-.75H2s0-1.25,0-1.25c0-.965,.785-1.75,1.75-1.75h3c.965,0,1.75,.785,1.75,1.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_heightMax;