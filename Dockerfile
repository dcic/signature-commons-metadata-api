FROM node

ADD . /app
WORKDIR /app
RUN npm install

ENV ADMIN_USERNAME ""
ENV ADMIN_PASSWORD ""
ENV BIO_ONTOLOGY_API_KEY ""
ENV NODE_ENV production

CMD [ "npm", "start" ]
