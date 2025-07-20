import "reflect-metadata";
import "./types/global";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.js";
import { createStore } from "@store/store.shared";
import { Provider } from "react-redux";

const store = createStore();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
	</StrictMode>
);
