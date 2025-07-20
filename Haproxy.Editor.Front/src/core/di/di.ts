import { Container } from "inversify";
import { addDiApis } from "@/core/di/api.di";
import { addDiServices } from "@/core/di/services.di";

export const container = new Container();

addDiApis(container);
addDiServices(container);
