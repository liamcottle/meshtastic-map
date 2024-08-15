FROM node:lts-alpine

WORKDIR /app

COPY ./api/ /app/

COPY ./prisma /app/

RUN npm config set @buf:registry https://buf.build/gen/npm/v1/

RUN npm install --frozen-lockfile

RUN npx prisma generate

RUN npm run build

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -O- http://localhost:${HTTP_PORT:=80}/api/healthz || exit 1

CMD ["npm", "run", "start"]