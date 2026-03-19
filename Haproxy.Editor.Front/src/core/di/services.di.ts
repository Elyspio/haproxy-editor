import { Container } from "inversify";
import { AuthService } from "@services/auth.service";
import { ConfigService } from "@services/config.service";

export function addDiServices(container: Container) {
	container.bind(AuthService).toSelf();
	container.bind(ConfigService).toSelf();
}
