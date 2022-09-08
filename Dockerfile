FROM node:18

WORKDIR /pap-bot

COPY package.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]