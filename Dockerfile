FROM docker.tradeshift.net/tradeshift-docker-node:onbuild-2.0.5

# This should ideally be before npm install, but we're not ready for a prod build
ENV NO_UPDATE_NOTIFIER true

WORKDIR /usr/src/app
ADD package.json .
RUN npm install && npm cache clean --force

COPY . .
