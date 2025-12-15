# -------------------------------
# Etapa 1: Build (Vite)
# -------------------------------
FROM node:18-alpine AS builder
WORKDIR /app

# ---- ARGs (recibidos desde docker build) ----
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ARG VITE_AUTH0_CALLBACK_URL
ARG VITE_API_BASE_URL
ARG VITE_API_USER_BASE_URL

# ---- Exportarlos como ENV para Vite (build-time) ----
ENV VITE_AUTH0_DOMAIN=${VITE_AUTH0_DOMAIN}
ENV VITE_AUTH0_CLIENT_ID=${VITE_AUTH0_CLIENT_ID}
ENV VITE_AUTH0_AUDIENCE=${VITE_AUTH0_AUDIENCE}
ENV VITE_AUTH0_CALLBACK_URL=${VITE_AUTH0_CALLBACK_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_USER_BASE_URL=${VITE_API_USER_BASE_URL}

# ---- Instalar dependencias ----
COPY package*.json ./
RUN npm install

# ---- Copiar código y build ----
COPY . .
RUN npm run build

# -------------------------------
# Etapa 2: Runtime (NGINX)
# -------------------------------
FROM nginx:1.27-alpine

# Copiar build estático
COPY --from=builder /app/dist /usr/share/nginx/html

# Remover config default
RUN rm /etc/nginx/conf.d/default.conf

# Configuración custom de nginx
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

# Exponer puerto interno
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]