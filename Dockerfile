FROM node:lts-alpine

WORKDIR /app

# Copy only package files and install deps
# This layer will be cached as long as package*.json don't change
COPY package*.json package-lock.json* ./
RUN npm ci

# Copy the rest of your source
COPY . .

RUN apk add --no-cache openssl


EXPOSE 8080