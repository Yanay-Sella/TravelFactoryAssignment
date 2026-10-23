# Development image: the API runs through ts-node, the same way it runs on a host.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8888

CMD ["npm", "run", "dev"]
