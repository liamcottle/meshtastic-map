FROM node:lts-alpine

# add project files to /app
ADD ./ /app
WORKDIR /app

RUN apk add --no-cache openssl

# install node dependencies
RUN npm install

EXPOSE 8080
