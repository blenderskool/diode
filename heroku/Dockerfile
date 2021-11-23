FROM node:14-alpine as app

WORKDIR /app
COPY ../ ../

ENV SECRETS_KEY=
ENV SECRETS_IV=

RUN npm install
RUN npm run build

EXPOSE 3000

RUN apk --update add redis

COPY ./start.sh ./
RUN chmod +x ./start.sh

CMD ["sh", "./start.sh"]
