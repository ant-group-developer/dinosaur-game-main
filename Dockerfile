FROM nginx:stable-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/public/ /usr/share/nginx/html/
COPY deploy/40-site-config.sh /docker-entrypoint.d/40-site-config.sh
RUN chmod +x /docker-entrypoint.d/40-site-config.sh
ENV SITE_URL=https://dino.antfootage.net
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
