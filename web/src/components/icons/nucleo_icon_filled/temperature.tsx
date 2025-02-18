import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_temperature(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px temperature";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M10.5,10.017V4.25c0-1.792-1.458-3.25-3.25-3.25s-3.25,1.458-3.25,3.25v5.767c-.647,.766-1,1.725-1,2.733,0,2.343,1.907,4.25,4.25,4.25s4.25-1.907,4.25-4.25c0-1.008-.353-1.967-1-2.733Zm-3.25,4.233c-.828,0-1.5-.672-1.5-1.5,0-.554,.304-1.032,.75-1.292V6.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.708c.446,.26,.75,.738,.75,1.292,0,.828-.672,1.5-1.5,1.5Z" fill={fill}/>
		<path d="M15.25,4.5h-2.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M15.25,7.5h-2.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M15.25,10.5h-2.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default 18px_temperature;