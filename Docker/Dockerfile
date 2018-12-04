FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Configure log volume
VOLUME ["/usr/src/app/logs"]

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY .babelrc ./

# set Github credentials in order to install npm packages
ARG GITHUB_NAME
ARG GIT_ACCESS_TOKEN
RUN git config --global user.name ${GITHUB_NAME}
RUN git config --global url."https://${GIT_ACCESS_TOKEN}:@github.com/".insteadOf "https://github.com/"

# Install app dependencies
RUN npm install

# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY ./src ./src
COPY ./config ./config

# Build app
RUN npm run build

CMD [ "npm", "run", "run:prod" ]