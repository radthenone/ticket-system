ARG NODE_VERSION=22.14.0-alpine
ARG ANGULAR_VERSION=17.3.16

FROM node:${NODE_VERSION} AS dev

ENV NODE_ENV=development

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./

RUN npm install -g @angular/cli@${ANGULAR_VERSION}

COPY frontend/ ./

RUN npm install

EXPOSE 3000 49153

CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "3000", "--poll", "2000"]
