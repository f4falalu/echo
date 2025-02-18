import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_animationFast(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px animation fast";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M11.828,15.17c-.704,0-1.408-.268-1.944-.804l-3.421-3.422c-.52-.519-.806-1.209-.806-1.944s.286-1.425,.806-1.944l3.421-3.422c1.072-1.071,2.817-1.072,3.889,0h0l3.421,3.422c.52,.519,.806,1.209,.806,1.944s-.286,1.425-.806,1.944l-3.421,3.422c-.536,.536-1.24,.804-1.945,.804Z" fill={fill}/>
		<path d="M4,9.75H.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M5.25,6.5H3.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M5.25,13H3.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default 18px_animationFast;