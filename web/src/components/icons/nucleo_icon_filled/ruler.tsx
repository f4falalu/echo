import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_ruler(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px ruler";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.425,4.757l-3.183-3.183c-.681-.682-1.792-.68-2.474,0L1.575,10.768c-.682,.682-.682,1.792,0,2.475l3.183,3.183c.341,.341,.789,.511,1.237,.511s.896-.171,1.237-.512l.531-.531-1.798-1.798c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.798,1.798,.707-.707-1.091-1.091c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.091,1.091,.707-.707-1.798-1.798c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.798,1.798,.707-.707-1.091-1.091c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.091,1.091,2.298-2.298c.682-.682,.682-1.792,0-2.475Zm-4.425,.743c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_ruler;