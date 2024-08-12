FROM node:lts-alpine

WORKDIR /app

COPY . .

RUN npm build

EXPOSE 8080

CMD ["npm", "run", "start"]