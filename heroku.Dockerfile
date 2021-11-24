FROM node:14-alpine as app

WORKDIR /app
COPY ./ ./

ENV SECRETS_KEY=
ENV SECRETS_IV=

RUN npm install
RUN npm run build

EXPOSE 3000

RUN apk --update add redis

COPY ./heroku-docker.start.sh ./
RUN chmod +x ./heroku-docker.start.sh

CMD ["sh", "./heroku-docker.start.sh"]
