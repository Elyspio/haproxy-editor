import { Container } from "inversify";
import { Api } from "@apis/api";

export function addDiApis(container: Container) {
	container.bind(Api).toSelf();
}
