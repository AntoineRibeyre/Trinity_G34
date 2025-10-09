# ==========================================
# Stage 1: Build
# ==========================================
FROM node:22-alpine AS builder

# Installer Angular CLI version 20.3
RUN npm install -g @angular/cli@20.3

# Désactiver l'analytics globalement
RUN ng analytics off --global

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Installer Apollo Client manuellement (pas avec ng add)
#RUN npm install @apollo/client graphql
#
#RUN npm install @types/node
#
#RUN npm install @ngx-translate/core
#
#RUN npm install @ngx-translate/http-loader

# Copier le code source
COPY . .

# Désactiver l'analytics pour ce projet aussi
RUN ng analytics off || true

# Build de production au lieu de ng serve
RUN ng build --configuration production

# ==========================================
# Stage 2: Serve avec Nginx
# ==========================================
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Configuration nginx simple pour Angular
RUN echo 'server {listen 80;root /usr/share/nginx/html;index index.html;location / {try_files $uri $uri/ /index.html;}}' > /etc/nginx/conf.d/default.conf

# Exposer le port 80 (au lieu de 4200)
EXPOSE 80

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
