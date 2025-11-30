# Etapa 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: Servir build estático con NGINX
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Remover la config default para evitar conflictos
RUN rm /etc/nginx/conf.d/default.conf

# Exponer puerto 80 (dentro del contenedor)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
