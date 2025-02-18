import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_collision(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px collision";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.986,8.105c-.062-.311-.312-.55-.625-.597l-3.278-.492,1.627-4.775c.107-.316-.007-.666-.281-.857-.273-.192-.644-.178-.901,.033l-4.031,3.273L6.614,.57c-.193-.278-.548-.392-.869-.276-.318,.115-.521,.429-.492,.767l.378,4.614-3.75-.664c-.343-.061-.679,.12-.817,.437-.14,.317-.044,.688,.23,.897l3.57,2.729-3.395,3.395c-.233,.234-.287,.593-.131,.884,.155,.292,.482,.445,.809,.381l4.288-.858,.834,3.544c.072,.307,.33,.537,.644,.573,.029,.003,.059,.005,.087,.005,.281,0,.543-.159,.671-.415l1.612-3.225,5.038,3.505c.287,.198,.671,.175,.932-.059,.259-.234,.322-.615,.153-.92l-2.856-5.156,3.084-1.836c.272-.163,.413-.478,.353-.789Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_collision;