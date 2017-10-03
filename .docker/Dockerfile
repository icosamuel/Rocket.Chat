FROM rocketchat/base:4

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

EXPOSE 3000

ADD ./build /app

RUN cd /app/bundle/programs/server \
 && npm install \
 && npm cache clear

VOLUME /app/uploads

WORKDIR /app/bundle

CMD ["node", "main.js"]
