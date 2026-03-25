FROM node:24 AS build

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY Haproxy.Editor.Front/package.json ./
COPY Haproxy.Editor.Front/pnpm-lock.yaml ./
COPY Haproxy.Editor.Front/pnpm-workspace.yaml ./
#COPY Haproxy.Editor.Front/.npmrc ./

RUN pnpm install --frozen-lockfile

WORKDIR /app
COPY Haproxy.Editor.Front/ ./
RUN pnpm build

FROM nginx:alpine3.23-slim AS final

COPY Haproxy.Editor.Deployment/build/config/front/entrypoint.sh /entrypoint.sh
RUN chmod u+x /entrypoint.sh

COPY --from=build /app/dist /usr/share/nginx/html
COPY Haproxy.Editor.Deployment/build/config/front /etc/nginx

CMD ["/entrypoint.sh"] 