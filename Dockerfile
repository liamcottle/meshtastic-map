FROM node:lts-alpine

RUN apk add --no-cache openssl

USER node:node

WORKDIR /app

# Copy only package files and install deps
# This layer will be cached as long as package*.json don't change
COPY package*.json package-lock.json* ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm ci --omit=dev

# Copy the rest of your source
COPY . .


EXPOSE 8080
