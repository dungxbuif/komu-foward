FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --ignore-engines

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN yarn build

FROM node:22-alpine

WORKDIR /app
COPY package.json yarn.lock ./

RUN yarn install --production --frozen-lockfile --ignore-engines

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main"]
