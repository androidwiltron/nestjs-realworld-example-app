FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

ENV NODE_ENV production

RUN npm ci --only=production

COPY ./dist .
COPY ormconfig.js .

CMD [ "node", "main.js" ]


