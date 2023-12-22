FROM node:18-alpine

WORKDIR /app
COPY ./ ./

RUN npm install
RUN npm run build

EXPOSE 3000

COPY ./start.sh ./
RUN chmod +x ./start.sh

CMD ["sh", "./start.sh"]
