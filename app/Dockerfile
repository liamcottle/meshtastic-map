FROM node:lts-alpine

WORKDIR /app

COPY ./app/ /app/

RUN npm install --frozen-lockfile

CMD ["npm", "run", "start"]