import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function newspaper(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "newspaper";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M3.5,17c-1.379,0-2.5-1.122-2.5-2.5v-4.25c0-.689,.561-1.25,1.25-1.25h.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-.25v4c0,.551,.448,1,1,1,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M14.25,1H7.25c-1.517,0-2.75,1.233-2.75,2.75V14.5c0,.551-.448,1-1,1-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.25c1.517,0,2.75-1.233,2.75-2.75V3.75c0-1.517-1.233-2.75-2.75-2.75Zm-1,13h-5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm0-3h-5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm.75-3.75c0,.414-.336,.75-.75,.75h-5c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75h5c.414,0,.75,.336,.75,.75v2.5Z" fill={fill}/>
	</g>
</svg>
	);
};

export default newspaper;