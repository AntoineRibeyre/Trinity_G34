# ==========================================
# Stage 1: Build Angular + Compodoc
# ==========================================
FROM node:20-alpine AS builder


# Installer bash
RUN apk add --no-cache bash

# Installer Angular CLI version 20.3 et Compodoc
RUN npm install -g @angular/cli@20.3 @compodoc/compodoc

# Désactiver analytics globalement
RUN ng analytics off --global || true

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances du projet
RUN npm install

# Copier le code source
COPY . .

# Installer Apollo Client et types Node
RUN npm install @apollo/client graphql
RUN npm install @types/node

# Build de production Angular
RUN ng build --configuration production

# Génération de la documentation Compodoc
RUN npx compodoc -p tsconfig.app.json -d docs

# ==========================================
# Stage 2: Serve avec Nginx
# ==========================================
FROM nginx:alpine

# Supprimer la configuration par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers Angular buildés
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Copier la documentation générée (accessible via /docs)
COPY --from=builder /app/docs /usr/share/nginx/html/docs

# Exposer le port HTTP
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
