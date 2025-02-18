import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_chartActivity2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px chart activity 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M11.014,14.983h-.014c-.486-.006-.899-.307-1.053-.768L6.973,5.29l-1.279,3.553c-.25,.692-.911,1.157-1.646,1.157H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.297c.105,0,.2-.066,.235-.166l1.646-4.574c.164-.457,.555-.779,1.07-.743,.486,.006,.899,.307,1.053,.768l2.975,8.925,1.279-3.553c.25-.692,.911-1.157,1.646-1.157h2.297c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-2.297c-.105,0-.2,.066-.235,.166l-1.646,4.574c-.163,.453-.577,.743-1.057,.743Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_chartActivity2;