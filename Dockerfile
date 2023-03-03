FROM node:16.13.0

RUN apt-get update && \
  apt-get install -y && \
  rm -rf /var/lib/apt/lists/*

COPY package.json .
RUN npm install 
COPY . .
EXPOSE 5000

CMD ["node", "index.js"]`
