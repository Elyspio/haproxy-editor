import { jwtDecode } from "jwt-decode";

export function isValidJwt(token: string): boolean {
	const { exp } = jwtDecode(token);
	const currentTime = Math.floor(Date.now() / 1000);
	return (exp ?? 0) > currentTime;
}
