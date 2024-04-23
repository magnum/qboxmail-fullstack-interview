FROM debian:latest
WORKDIR /webmail
RUN apt update
RUN apt dist-upgrade -y
RUN apt install -y curl build-essential vim python3
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt update
# RUN apt install -y nodejs=18.* npm
RUN apt install nodejs
COPY package.json /webmail/
COPY package-lock.json /webmail/
RUN npm install -g npm@latest
RUN npm install
