import { Middleware, type UnknownAction } from "@reduxjs/toolkit";

export const logErrorMiddleware: Middleware = () => (next) => (action) => {
	const currentAction: UnknownAction = JSON.parse(JSON.stringify(action));

	if (isRejectedAction(currentAction)) {
		console.error(new Error(`AsyncAction rejected ${currentAction.type} ${currentAction.error.stack}`), { arg: currentAction.meta.arg });
	}

	return next(currentAction);
};

type RejectedAction<T = unknown> = {
	type: string;
	meta: {
		arg: T;
	};
	error: {
		name: string;
		message: string;
		stack: string;
	};
};

function isRejectedAction(action: UnknownAction): action is RejectedAction {
	return action.type.toString().endsWith("/rejected") && "error" in action;
}
