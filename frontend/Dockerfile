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

# Copier le code source
COPY . .

# Désactiver l'analytics pour ce projet aussi
RUN ng analytics off || true

# Build de production
RUN ng build --configuration production

# ==========================================
# Stage 2: Serve avec Nginx
# ==========================================
FROM nginx:alpine

# Supprimer la configuration par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copier VOTRE configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Exposer les ports
EXPOSE 80

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]