FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache vips-dev

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN mkdir -p uploads/podcasts uploads/pdfs audio uploads/temp

EXPOSE 3000

CMD ["node", "server.js"]
