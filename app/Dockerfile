FROM node:lts-alpine

WORKDIR /app

COPY ./app/ /app/

RUN npm install --frozen-lockfile

EXPOSE 8080

CMD ["npm", "run", "start"]