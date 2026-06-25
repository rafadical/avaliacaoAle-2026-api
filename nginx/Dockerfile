FROM nginx:1.27-alpine

RUN apk add --no-cache openssl \
 && mkdir -p /etc/nginx/certs \
 && openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
      -keyout /etc/nginx/certs/key.pem \
      -out /etc/nginx/certs/cert.pem \
      -subj "/C=BR/ST=SP/L=Local/O=CursosAPI/CN=localhost"

COPY nginx.conf /etc/nginx/nginx.conf
