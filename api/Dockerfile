FROM node:lts-alpine

WORKDIR /app

COPY ./api/ /app/

COPY ./prisma /app/

RUN npm config set @buf:registry https://buf.build/gen/npm/v1/

RUN npm install --frozen-lockfile

RUN npx prisma generate

RUN npm run build

CMD ["npm", "run", "start"]