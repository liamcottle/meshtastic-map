FROM node:lts-alpine

WORKDIR /app

COPY ./app/ /app/

COPY ./prisma /app/

RUN npm install --frozen-lockfile

RUN npx prisma generate

EXPOSE 8080

CMD ["npm", "run", "start"]