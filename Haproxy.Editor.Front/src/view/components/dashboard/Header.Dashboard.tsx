import { alpha, useTheme } from "@mui/material/styles";
import { AppBar, Avatar, Box, IconButton, InputAdornment, List, ListItemButton, ListItemText, Paper, Stack, TextField, Toolbar, Typography } from "@mui/material";
import { DarkModeOutlined, LightModeOutlined, Menu, Search, ViewSidebarOutlined } from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ReactNode, startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/view/context/auth.context";
import { useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";
import { saveThemePreference, searchDashboard } from "@modules/dashboard/dashboard.async.actions";
import { serializeSelection } from "@modules/dashboard/dashboard.utils";
import { setDashboardSelection } from "@modules/dashboard/dashboard.reducer";

export interface DashboardHeaderProps {
	logo?: ReactNode;
	menuOpen: boolean;
	onToggleMenu: (open: boolean) => void;
}

export function DashboardHeader({ logo, menuOpen, onToggleMenu }: DashboardHeaderProps) {
	const theme = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const themeMode = useAppSelector((state) => state.dashboard.themeMode);
	const searchResults = useAppSelector((state) => state.dashboard.searchResults);
	const storeQuery = useAppSelector((state) => state.dashboard.searchQuery);
	const [query, setQuery] = useState(storeQuery);
	const deferredQuery = useDeferredValue(query);

	useEffect(() => {
		startTransition(() => {
			dispatch(searchDashboard(deferredQuery));
		});
	}, [deferredQuery, dispatch]);

	const displayName = useMemo(() => String(user?.profile?.name ?? user?.profile?.preferred_username ?? "Operator"), [user]);

	return (
		<AppBar
			color="transparent"
			position="static"
			sx={{
				boxShadow: "none",
				borderBottom: `1px solid ${theme.palette.divider}`,
				backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.86 : 0.78),
				backdropFilter: "blur(20px)",
			}}
		>
			<Toolbar sx={{ minHeight: { xs: 72, md: 78 }, gap: 2 }}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
					<IconButton color="inherit" onClick={() => onToggleMenu(!menuOpen)}>
						{menuOpen ? <ViewSidebarOutlined /> : <Menu />}
					</IconButton>
					<Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
						<Stack direction="row" alignItems="center" spacing={1}>
							{logo}
						
						</Stack>
					</Link>
				</Stack>

				<Box sx={{ position: "relative", flex: 1, maxWidth: 620 }}>
					<TextField
						fullWidth
						size="small"
						placeholder="Search services, routes, ACLs and servers..."
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search fontSize="small" />
								</InputAdornment>
							),
						}}
					/>

					{query.trim() && searchResults.length > 0 ? (
						<Paper
							sx={{
								position: "absolute",
								top: "calc(100% + 8px)",
								left: 0,
								right: 0,
								zIndex: theme.zIndex.modal,
								maxHeight: 360,
								overflow: "auto",
							}}
						>
							<List dense disablePadding>
								{searchResults.map((result) => (
									<ListItemButton
										key={result.id}
										selected={location.pathname === result.route}
										onClick={() => {
											dispatch(setDashboardSelection(result.selection));
											setQuery("");
											navigate(`${result.route}${result.route === "/" ? "" : `?${serializeSelection(result.selection)}`}`);
										}}
									>
										<ListItemText primary={result.title} secondary={`${result.kind.toUpperCase()} · ${result.subtitle}`} />
									</ListItemButton>
								))}
							</List>
						</Paper>
					) : null}
				</Box>

				<Stack direction="row" alignItems="center" spacing={1} ml={"auto"}>
					<IconButton color="inherit" onClick={() => dispatch(saveThemePreference(themeMode === "dark" ? "light" : "dark"))}>
						{themeMode === "dark" ? <LightModeOutlined /> : <DarkModeOutlined />}
					</IconButton>

					<Stack direction="row" alignItems="center" spacing={1.25} sx={{ pl: 1 }}>
						<Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: theme.palette.text.primary }}>
							{displayName.charAt(0).toUpperCase()}
						</Avatar>
						<Box sx={{ display: { xs: "none", sm: "block" } }}>
							<Typography variant="body1">{displayName}</Typography>
							<Typography variant="body2" color="text.secondary">
								Cockpit operator
							</Typography>
						</Box>
					</Stack>
				</Stack>
			</Toolbar>
		</AppBar>
	);
}
