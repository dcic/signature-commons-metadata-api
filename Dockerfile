FROM node

ADD . /app
WORKDIR /app
RUN npm install

ENV POSTGRESQL_URL ""
ENV NODE_ENV production

CMD [ "npm", "start" ]