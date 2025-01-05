FROM oven/bun:latest AS base
WORKDIR /usr/src

# install dependencies into temp directory
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=local
# RUN bun test
# RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=prerelease /usr/src/ /usr/app/
COPY postgres-server.crt /usr/local/share/ca-certificates/
WORKDIR /usr/local/share/ca-certificates
RUN apt update
RUN apt install -y ca-certificates
RUN update-ca-certificates

# run the app
USER root
WORKDIR /usr/app
RUN chmod +x ./docker_scripts/dockerstart.sh
ENTRYPOINT [ "./docker_scripts/dockerstart.sh" ]