FROM node:24-alpine
WORKDIR /scanner
COPY services/file-scanner/server.mjs ./server.mjs
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
