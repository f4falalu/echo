import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function compass4(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "compass 4";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M12.239,4.775l-4.214,1.806c-.652,.28-1.165,.793-1.444,1.445l-1.806,4.214c-.121,.282-.058,.609,.159,.826,.144,.144,.335,.22,.53,.22,.1,0,.2-.02,.296-.061l4.214-1.806c.652-.28,1.165-.793,1.444-1.445l1.806-4.214c.121-.282,.058-.609-.159-.826s-.543-.278-.826-.159Z" fill={secondaryfill}/>
		<path d="M9,4c.414,0,.75-.336,.75-.75V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.5c0,.414,.336,.75,.75,.75Z" fill={fill}/>
		<path d="M16.25,8.25h-1.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={fill}/>
		<path d="M9,14c-.414,0-.75,.336-.75,.75v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5c0-.414-.336-.75-.75-.75Z" fill={fill}/>
		<path d="M3.25,8.25H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default compass4;