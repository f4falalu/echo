import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function gridSystem(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "grid system";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.25,15H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h14.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M16.25,11.5h-5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M7.5,11.5H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H7.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M16.25,8h-2.812c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.812c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M10.438,8h-2.875c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.875c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M4.562,8H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.812c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M3,4.5H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M7.25,4.5h-1.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M16.25,4.5h-1.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M12,4.5h-1.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default gridSystem;