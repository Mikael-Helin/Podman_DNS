FROM node:bullseye as production

RUN mkdir -p /etc/bind/zones
RUN mkdir -p /opt/app/dist/html
RUN mkdir -p /opt/app/data
WORKDIR /opt/app

RUN apt-get update
RUN apt-get install -y bind9

RUN node --version
RUN npm --version

COPY ./package.json /opt/app
RUN npm install

COPY ./src/app.js /opt/app/dist/app.js
COPY ./src/html/index.html /opt/app/dist/html/
COPY ./shared/entrypoint.sh /opt/app/entrypoint.sh
RUN chmod +x /opt/app/entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/opt/app/entrypoint.sh"]
CMD [ "node", "/opt/app/dist/app.js" ]


# Set up the test image
FROM r53:production as testing

RUN npm install jsdom
RUN npm install --save-dev jest
RUN npx jest --version
#RUN node -p "require('sqlite3').verbose().VERSION"

COPY ./testing /opt/app/testing

ENTRYPOINT ["npm", "test"]
