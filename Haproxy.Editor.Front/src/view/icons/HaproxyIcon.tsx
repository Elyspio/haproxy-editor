import * as React from "react";
import SvgIcon from "@mui/material/SvgIcon";

const primaryColor = "#2581eb";

export default function HaproxyIcon() {
	return (
		<SvgIcon sx={{ height: 48, width: 210, mr: 2 }}>
			<svg width="260" height="56" viewBox="0 0 260 56" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="24" cy="28" r="5" fill={primaryColor} />
				<circle cx="42" cy="16" r="3" fill={primaryColor} />
				<circle cx="42" cy="40" r="3" fill={primaryColor} />
				<line x1="28" y1="27" x2="39" y2="18.5" stroke="#2563eb" strokeWidth="2" />
				<line x1="28" y1="29" x2="39" y2="37.5" stroke="#2563eb" strokeWidth="2" />
				<text x="60" y="38" fontFamily="Segoe UI, Arial, sans-serif" fontSize="30" fontWeight="600" fill="#1a1a1a">
					<tspan fontFamily="Montserrat, Segoe UI, Arial, sans-serif" fontWeight="700" fill={primaryColor}>
						H
					</tspan>
					aproxy
				</text>
				<text x="60" y="52" fontFamily="Segoe UI, Arial, sans-serif" fontSize="14" fontWeight="400" fill={primaryColor}>
					editor
				</text>
			</svg>
		</SvgIcon>
	);
}
