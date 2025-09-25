FROM node:lts-alpine AS build

RUN apk add --no-cache openssl

WORKDIR /app

# Copy only package files and install deps
# This layer will be cached as long as package*.json don't change
COPY package*.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# Copy the rest of your source
COPY . .

# Pre-generate prisma client
RUN node_modules/.bin/prisma generate

FROM node:lts-alpine

RUN apk add --no-cache openssl

USER node:node

WORKDIR /app

COPY --from=build --chown=node:node /app .


EXPOSE 8080
