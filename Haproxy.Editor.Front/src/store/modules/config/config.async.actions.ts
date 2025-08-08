import { createAsyncActionGenerator, getService } from "@store/utils/utils.actions";
import { ConfigService } from "@services/config.service";

const createAsyncThunk = createAsyncActionGenerator("config");

export const startApp = createAsyncThunk(
	"start",
	async (_, { extra }) => {
		const service = getService(ConfigService, extra);

		return await service.getConfig();
	},
	{ noPrefix: true }
);

export const syncConfig = createAsyncThunk("sync", async (_, { extra, getState }) => {
	const service = getService(ConfigService, extra);

	const config = getState().config.current;

	return await service.updateConfig(config);
});
