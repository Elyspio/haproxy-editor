import { Container } from "inversify/lib/esm";
import { AuthService } from "@services/auth.service";

export function addDiServices(container: Container) {
	container.bind(AuthService).toSelf();
}
