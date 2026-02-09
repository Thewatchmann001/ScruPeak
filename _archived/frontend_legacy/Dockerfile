FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./

ENV REACT_APP_API_URL=http://localhost:3000/api

RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
