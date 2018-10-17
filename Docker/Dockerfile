FROM node:8

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./


ARG GITHUB_NAME
ARG GIT_ACCESS_TOKEN
ARG PORT
RUN git config --global user.name ${GITHUB_NAME}
RUN git config --global url."https://${GIT_ACCESS_TOKEN}:@github.com/".insteadOf "https://github.com/"

# Install app dependencies
RUN npm install

# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

# Build app
RUN npm run build
EXPOSE ${PORT}

CMD [ "npm", "run", "run:prod" ]