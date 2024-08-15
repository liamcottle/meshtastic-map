FROM node:lts-alpine

WORKDIR /app

COPY ./app/ /app/

RUN npm install --frozen-lockfile

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -O- http://localhost:${HTTP_PORT:=80}/ || exit 1

CMD ["npm", "run", "start"]