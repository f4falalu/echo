import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function book(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "book";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M2.75,6.25c-.414,0-.75-.336-.75-.75,0-2.105,1.506-3.89,3.581-4.244L11.587,.165c.783-.142,1.566,.264,1.901,.987,.174,.376,.01,.822-.365,.996-.38,.174-.822,.01-.996-.366-.048-.103-.161-.16-.272-.141l-6.014,1.092c-1.359,.232-2.341,1.396-2.341,2.767,0,.414-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M14.25,3H4.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75H14.25c.965,0,1.75-.785,1.75-1.75V4.75c0-.965-.785-1.75-1.75-1.75ZM5,15.5h-.25c-.689,0-1.25-.561-1.25-1.25V5.75c0-.689,.561-1.25,1.25-1.25h.25V15.5Zm8-5.25c0,.414-.336,.75-.75,.75h-3.5c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75h3.5c.414,0,.75,.336,.75,.75v2.5Z" fill={fill}/>
	</g>
</svg>
	);
};

export default book;