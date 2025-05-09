FROM node:22 AS build-stage

WORKDIR /app

COPY package*.json /app/
RUN npm install
COPY ./ /app/

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build && npx next export

FROM nginx:1
COPY --from=build-stage /app/out/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf
