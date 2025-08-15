# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/. .
# If you use REACT_APP_API_URL in code, you can pass as build-arg (optional):
# ARG REACT_APP_API_URL
# ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

FROM nginx:alpine AS serve
WORKDIR /usr/share/nginx/html
COPY --from=build /app/build ./
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
