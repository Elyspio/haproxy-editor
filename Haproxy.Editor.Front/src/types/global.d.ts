import type {createBrowserRouter} from "react-router-dom";
import type {EnhancedStore} from "@reduxjs/toolkit";
import type {StoreState} from "@store/store.reducers";

declare global {
	interface Window {
		"haproxy-editor": {
			config: {
				oauth: {
					authority: string
					clientId: string
					callbackUrl: string
				};
				endpoints: {
					apiUrl: string
				}
			}
			router: ReturnType<typeof createBrowserRouter>,
			store: EnhancedStore<StoreState>
		}
	}
}