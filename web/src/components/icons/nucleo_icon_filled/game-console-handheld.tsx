import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function gameConsoleHandheld(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "game console handheld";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M13.25,1.5H4.75c-.965,0-1.75,.785-1.75,1.75V14.75c0,.965,.785,1.75,1.75,1.75h6.5c2.068,0,3.75-1.682,3.75-3.75V3.25c0-.965-.785-1.75-1.75-1.75Zm-4.75,11.5h-.5v.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-.5h-.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.5v-.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v.5h.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm2.75,1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm1-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm.75-3.75c0,.414-.336,.75-.75,.75H5.75c-.414,0-.75-.336-.75-.75V4.25c0-.414,.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75v4Z" fill={fill}/>
	</g>
</svg>
	);
};

export default gameConsoleHandheld;