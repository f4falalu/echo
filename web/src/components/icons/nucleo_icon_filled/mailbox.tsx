import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function mailbox(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "mailbox";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.723,4.485c-.368-.194-.821-.05-1.013,.315-.192,.367-.052,.82,.315,1.013,.909,.478,1.475,1.411,1.475,2.437v5c0,.138-.112,.25-.25,.25h-5.775c.012-.082,.025-.165,.025-.25v-5c0-1.053-.399-2.007-1.037-2.75h3.287c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H5.25c-2.344,0-4.25,1.907-4.25,4.25v5c0,.965,.785,1.75,1.75,1.75h5.25v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.25h5.75c.965,0,1.75-.785,1.75-1.75v-5c0-1.585-.873-3.028-2.277-3.765ZM6.25,12.5h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M14.25,0h-2.5c-.414,0-.75,.336-.75,.75V6.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75h1.75c.414,0,.75-.336,.75-.75V.75c0-.414-.336-.75-.75-.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default mailbox;