import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { produce, type Draft } from "immer";
import type { HaproxyResourceSnapshot } from "@modules/config/config.types";
import { cloneSnapshot, createEmptySnapshot, snapshotsEqual } from "@modules/config/config.utils";
import { useConfigQuery } from "@/core/api/queries";
import { useAuth } from "@/view/context/auth.context";

export type ConfigurationHydrationStatus = "idle" | "loading" | "ready" | "error";
export type ConfigurationDraftUpdater = (draft: Draft<HaproxyResourceSnapshot>) => void;

type ConfigurationDraftContextValue = {
	snapshot: HaproxyResourceSnapshot;
	hasUnsavedChanges: boolean;
	hydrationStatus: ConfigurationHydrationStatus;
	isDraftLocked: boolean;
	updateSnapshot: (updater: ConfigurationDraftUpdater) => boolean;
	discardSnapshotChanges: () => void;
	retryHydration: () => void;
	captureSnapshotForSave: () => HaproxyResourceSnapshot | null;
	completeSave: (snapshot: HaproxyResourceSnapshot) => void;
	abortSave: () => void;
};

const ConfigurationDraftContext = createContext<ConfigurationDraftContextValue | undefined>(undefined);

const DIRTY_RECONCILIATION_DELAY_MS = 250;

export function ConfigurationDraftProvider({ children }: Readonly<{ children: ReactNode }>) {
	const { user } = useAuth();
	const queryEnabled = Boolean(user && !user.expired);
	const config = useConfigQuery(queryEnabled);
	const initialSnapshot = queryEnabled && config.data ? cloneSnapshot(config.data) : createEmptySnapshot();
	const initiallyHydrated = queryEnabled && Boolean(config.data);
	const [snapshot, setSnapshot] = useState<HaproxyResourceSnapshot>(initialSnapshot);
	const [savedBaseline, setSavedBaseline] = useState<HaproxyResourceSnapshot>(() => cloneSnapshot(initialSnapshot));
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [isHydrated, setIsHydrated] = useState(initiallyHydrated);
	const [previousQueryEnabled, setPreviousQueryEnabled] = useState(queryEnabled);
	const [isRetryingHydration, setIsRetryingHydration] = useState(false);
	const [isDraftLocked, setIsDraftLocked] = useState(false);
	const snapshotRef = useRef(snapshot);
	const savedBaselineRef = useRef(savedBaseline);
	const hydrationAcceptedRef = useRef(initiallyHydrated);
	const draftLockedRef = useRef(false);

	// A signed-out session must hydrate again from the server once the user is back.
	if (previousQueryEnabled !== queryEnabled) {
		setPreviousQueryEnabled(queryEnabled);
		if (!queryEnabled) setIsHydrated(false);
	}

	let hydrationStatus: ConfigurationHydrationStatus;
	if (!queryEnabled) hydrationStatus = "idle";
	else if (isHydrated) hydrationStatus = "ready";
	else if (config.isError && !isRetryingHydration) hydrationStatus = "error";
	else hydrationStatus = "loading";

	const resetDraft = useCallback((nextSnapshot: HaproxyResourceSnapshot) => {
		const accepted = cloneSnapshot(nextSnapshot);
		const nextDraft = cloneSnapshot(accepted);
		savedBaselineRef.current = accepted;
		snapshotRef.current = nextDraft;
		setSavedBaseline(accepted);
		setSnapshot(nextDraft);
		setHasUnsavedChanges(false);
	}, []);

	const acceptSnapshot = useCallback(
		(nextSnapshot: HaproxyResourceSnapshot) => {
			resetDraft(nextSnapshot);
			setIsHydrated(true);
			hydrationAcceptedRef.current = true;
		},
		[resetDraft]
	);

	useEffect(() => {
		if (!queryEnabled) {
			hydrationAcceptedRef.current = false;
			return;
		}

		if (config.data && !hydrationAcceptedRef.current) {
			acceptSnapshot(config.data);
		}
	}, [acceptSnapshot, config.data, queryEnabled]);

	useEffect(() => {
		if (!hasUnsavedChanges || hydrationStatus !== "ready") {
			return;
		}

		const timeout = window.setTimeout(() => {
			setHasUnsavedChanges(!snapshotsEqual(snapshotRef.current, savedBaselineRef.current));
		}, DIRTY_RECONCILIATION_DELAY_MS);

		return () => window.clearTimeout(timeout);
	}, [hasUnsavedChanges, hydrationStatus, snapshot]);

	useEffect(() => {
		if (!hasUnsavedChanges) {
			return;
		}

		const warnBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", warnBeforeUnload);
		return () => window.removeEventListener("beforeunload", warnBeforeUnload);
	}, [hasUnsavedChanges]);

	const updateSnapshot = useCallback((updater: ConfigurationDraftUpdater) => {
		if (draftLockedRef.current || !hydrationAcceptedRef.current) {
			return false;
		}

		const nextSnapshot = produce(snapshotRef.current, (draft) => {
			updater(draft);
			draft.summary.frontendCount = draft.frontends.length;
			draft.summary.backendCount = draft.backends.length;
			draft.summary.serverCount = draft.backends.reduce((count, backend) => count + backend.servers.length, 0);
		});
		snapshotRef.current = nextSnapshot;
		setSnapshot(nextSnapshot);
		setHasUnsavedChanges(true);
		return true;
	}, []);

	const discardSnapshotChanges = useCallback(() => {
		if (draftLockedRef.current) {
			return;
		}

		const restored = cloneSnapshot(savedBaselineRef.current);
		snapshotRef.current = restored;
		setSnapshot(restored);
		setHasUnsavedChanges(false);
	}, []);

	const retryHydration = useCallback(async () => {
		setIsRetryingHydration(true);
		try {
			// A failed attempt resolves with the error state; the status falls back to "error" once it settles.
			await config.refetch();
		} finally {
			setIsRetryingHydration(false);
		}
	}, [config]);

	const captureSnapshotForSave = useCallback(() => {
		if (draftLockedRef.current || !hydrationAcceptedRef.current) {
			return null;
		}

		draftLockedRef.current = true;
		setIsDraftLocked(true);
		return cloneSnapshot(snapshotRef.current);
	}, []);

	const unlockDraft = useCallback(() => {
		draftLockedRef.current = false;
		setIsDraftLocked(false);
	}, []);

	const completeSave = useCallback(
		(nextSnapshot: HaproxyResourceSnapshot) => {
			resetDraft(nextSnapshot);
			unlockDraft();
		},
		[resetDraft, unlockDraft]
	);

	const value = useMemo<ConfigurationDraftContextValue>(
		() => ({
			snapshot,
			hasUnsavedChanges,
			hydrationStatus,
			isDraftLocked,
			updateSnapshot,
			discardSnapshotChanges,
			retryHydration,
			captureSnapshotForSave,
			completeSave,
			abortSave: unlockDraft,
		}),
		[captureSnapshotForSave, completeSave, discardSnapshotChanges, hasUnsavedChanges, hydrationStatus, isDraftLocked, retryHydration, snapshot, unlockDraft, updateSnapshot]
	);

	return <ConfigurationDraftContext.Provider value={value}>{children}</ConfigurationDraftContext.Provider>;
}

export function useConfigurationDraft() {
	const context = useContext(ConfigurationDraftContext);
	if (!context) throw new Error("useConfigurationDraft must be used within ConfigurationDraftProvider");
	return context;
}

export function ConfigurationBoundary({ children }: Readonly<{ children: ReactNode }>) {
	const { hydrationStatus, retryHydration } = useConfigurationDraft();

	if (hydrationStatus === "ready") {
		return <>{children}</>;
	}

	if (hydrationStatus === "error") {
		return (
			<Stack role="alert" spacing={2} sx={{ alignItems: "center", justifyContent: "center", minHeight: "100dvh", p: 3 }}>
				<Alert severity="error">Unable to load the HAProxy configuration.</Alert>
				<Button variant="contained" onClick={retryHydration}>
					Retry
				</Button>
			</Stack>
		);
	}

	return (
		<Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
			<Stack spacing={2} sx={{ alignItems: "center" }}>
				<CircularProgress size={36} />
				<Typography sx={{ color: "text.secondary" }}>Loading configuration…</Typography>
			</Stack>
		</Box>
	);
}
