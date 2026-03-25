import { alpha, createTheme, responsiveFontSizes, type PaletteMode } from "@mui/material";
import type { ThemeMode } from "@modules/dashboard/dashboard.types";

function createPalette(mode: PaletteMode) {
	if (mode === "light") {
		return {
			mode,
			primary: { main: "#2f6fed" },
			secondary: { main: "#0f7b6c" },
			error: { main: "#c0493c" },
			warning: { main: "#d9951a" },
			success: { main: "#2f8f53" },
			info: { main: "#2d7ecb" },
			background: {
				default: "#edf2f9",
				paper: "#f8fbff",
			},
			divider: alpha("#16324f", 0.12),
			text: {
				primary: "#112033",
				secondary: alpha("#112033", 0.72),
			},
		};
	}

	return {
		mode,
		primary: { main: "#5d8fff" },
		secondary: { main: "#58c2a4" },
		error: { main: "#ff6c65" },
		warning: { main: "#efc85f" },
		success: { main: "#62d18b" },
		info: { main: "#67c1ff" },
		background: {
			default: "#0b1220",
			paper: "#121c2f",
		},
		divider: alpha("#dbe6ff", 0.08),
		text: {
			primary: "#eef4ff",
			secondary: alpha("#eef4ff", 0.7),
		},
	};
}

export function createCockpitTheme(mode: ThemeMode) {
	const palette = createPalette(mode);

	return responsiveFontSizes(
		createTheme({
			palette,
			shape: {
				borderRadius: 16,
			},
			typography: {
				fontFamily: '"Bahnschrift", "Segoe UI", "Arial Narrow", sans-serif',
				h1: { fontWeight: 700, letterSpacing: "0.03em" },
				h2: { fontWeight: 700, letterSpacing: "0.03em" },
				h3: { fontWeight: 700, letterSpacing: "0.03em" },
				h4: { fontWeight: 700, letterSpacing: "0.03em" },
				h5: { fontWeight: 700, letterSpacing: "0.03em" },
				h6: { fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" },
				subtitle1: { fontWeight: 600 },
				subtitle2: { fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" },
				button: { fontWeight: 700, letterSpacing: "0.05em", textTransform: "none" },
			},
			components: {
				MuiCssBaseline: {
					styleOverrides: {
						":root": {
							colorScheme: mode,
						},
						body: {
							background: mode === "light"
								? "radial-gradient(circle at top, rgba(47,111,237,0.08), transparent 30%), #edf2f9"
								: "radial-gradient(circle at top, rgba(93,143,255,0.14), transparent 25%), #0b1220",
						},
					},
				},
				MuiPaper: {
					styleOverrides: {
						root: {
							backgroundImage: "none",
							border: `1px solid ${palette.divider}`,
							boxShadow: mode === "light"
								? "0 16px 40px rgba(20, 34, 56, 0.08)"
								: "0 18px 42px rgba(2, 7, 17, 0.42)",
						},
					},
				},
				MuiCard: {
					styleOverrides: {
						root: {
							backgroundImage: "none",
						},
					},
				},
				MuiButton: {
					defaultProps: {
						disableElevation: true,
					},
				},
				MuiOutlinedInput: {
					styleOverrides: {
						root: {
							backgroundColor: mode === "light" ? alpha("#ffffff", 0.78) : alpha("#09111f", 0.58),
						},
					},
				},
				MuiListItemButton: {
					styleOverrides: {
						root: {
							borderRadius: 12,
						},
					},
				},
			},
		})
	);
}
