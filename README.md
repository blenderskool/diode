<div align="center">
  <h1>Diode 🔌</h1>
  <p><b>Open source API proxy server with an easy-to-use dashboard for configuring middlewares and secrets.</b></p>
</div>
<br />
<br />

![](https://user-images.githubusercontent.com/21107799/141688536-1dfc2db7-d334-493e-b23f-fe7e9cc1b6af.png)


### What does Diode do?
Third party APIs make it easy to integrate functionalities across apps. But using them on a purely front-end project is a hassle. Most of the time, the API endpoints require an API key which cannot be exposed on the frontend. Hence, most of us setup a proxy backend server that makes the request to the third party API with the API keys and make the frontend request this proxy server instead. While it might be a trivial solution that shouldn't take a lot of time to implement, it can get very repeatable and tedious over time.

**Diode solves this** problem by abstracting this proxy server and allowing you to add and configure as many API routes and consume them directly on the frontend **without having to worry about exposing any API keys**! Since Diode sits in between all the requests going to the third-party server, it also makes it easy to add **commonly used middlewares to the API route** with just a click!  
_Fun fact: All of this happens without you have to write a single line of code._

### Features
- 💡 Easy to use dashboard.
- ⏩ Query parameters and request headers forwarding.
- 🕶️ Encrypted Secrets that get dynamically injected when making request.
- 🔮 Request and Response structure preservation.
- One-click middlewares for:
  - 🚫 IP/HTTP restriction
  - ⏱️ Rate-limiting
  - 📌 Caching
- 💙 Open source, can be self-hosted.


## Project Setup
### Pre-requisites:
- Node.js and npm installed.
- Postgres installed.
- Redis installed.

### Clone the repo, install dependencies
```bash
git clone https://github.com/blenderskool/diode.git
cd diode
npm install
```

### Setup environment variables
Create a `.env` file and provide values for all the variables listed in `.env.example` file.

### Setup database
In the root of this project, run the following command to setup the database schema
```bash
npx prisma db push
```

### Build the project
```bash
npm run build
```

### Start the server
```bash
npm run start
```
Diode will start running at port `3000`.

### Explore the database
Prisma Studio makes it easy to explore and edit the data in the database. You can start it by running
```bash
npx prisma studio
```
Prisma Studio will be running at port `5555`.

## License 
Diode is [MIT Licensed](https://github.com/blenderskool/diode/blob/master/LICENSE)
