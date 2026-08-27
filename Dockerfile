FROM node:20-alpine AS builder

WORKDIR /app

ENV VITE_API_URL=/api

COPY package.json package-lock.json* ./

RUN npm install --no-audit --no-fund

COPY . .

RUN npm run build


FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=builder /app/dist /usr/share/nginx/html

ENV BACKEND_URL=https://onda-backend-production.up.railway.app

EXPOSE 8080

CMD ["/bin/sh", "-c", "export PORT=\"${PORT:-8080}\"; export BACKEND_URL=\"${BACKEND_URL:-https://onda-backend-production.up.railway.app}\"; envsubst '$PORT $BACKEND_URL' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf; nginx -t; exec nginx -g 'daemon off;'"]
