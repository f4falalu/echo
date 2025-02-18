import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_sortArrows(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px sort arrows";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9.932,1.916c-.475-.529-1.389-.529-1.863,0h0s-3.131,3.5-3.131,3.5c-.334,.373-.414,.887-.211,1.344,.204,.457,.642,.741,1.142,.741h6.264c.5,0,.938-.284,1.142-.741,.203-.457,.123-.971-.211-1.343l-3.131-3.5Z" fill={fill}/>
		<path d="M12.132,10.5H5.868c-.5,0-.938,.284-1.142,.741-.203,.457-.123,.971,.211,1.343l3.131,3.5h0c.237,.265,.577,.417,.932,.417s.694-.151,.932-.417l3.131-3.499c.334-.373,.414-.887,.211-1.344-.204-.457-.642-.741-1.142-.741Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default 18px_sortArrows;