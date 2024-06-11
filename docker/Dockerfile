FROM node:lts-alpine

COPY --from=ghcr.io/ufoscout/docker-compose-wait:latest /wait /wait

ADD ./ /app
WORKDIR /app
RUN npm install
EXPOSE 8080
