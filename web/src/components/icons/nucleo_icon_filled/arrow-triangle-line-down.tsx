import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_arrowTriangleLineDown(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px arrow triangle line down";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,11c-.414,0-.75-.336-.75-.75V2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V10.25c0,.414-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M12.058,9.5H5.942c-.463,0-.887,.254-1.104,.664-.217,.409-.191,.902,.069,1.287l3.058,4.517c.233,.344,.62,.549,1.035,.549s.802-.206,1.035-.549l3.058-4.517c.26-.384,.286-.877,.069-1.287-.217-.41-.641-.664-1.104-.664Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_arrowTriangleLineDown;