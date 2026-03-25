import { Container } from "inversify";
import { AuthService } from "@services/auth.service";
import { ConfigService } from "@services/config.service";
import { DashboardService } from "@services/dashboard.service";

export function addDiServices(container: Container) {
	container.bind(AuthService).toSelf();
	container.bind(ConfigService).toSelf();
	container.bind(DashboardService).toSelf();
}
