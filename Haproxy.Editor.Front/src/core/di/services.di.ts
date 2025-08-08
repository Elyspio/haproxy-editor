import { Container } from "inversify/lib/esm";
import { AuthService } from "@services/auth.service";
import { ConfigService } from "@services/config.service";

export function addDiServices(container: Container) {
	container.bind(AuthService).toSelf();
	container.bind(ConfigService).toSelf();
}
