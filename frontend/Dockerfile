# ==========================================
# Conteneur Angular pour développement
# ==========================================
FROM node:22-alpine

# Installer bash
RUN apk add --no-cache bash

# Installer Angular CLI version 20.3
RUN npm install -g @angular/cli@20.3

# Désactiver analytics globalement
RUN ng analytics off --global || true

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Installer Apollo Client et types Node
RUN npm install @apollo/client graphql
RUN npm install @types/node

# Exposer le port pour ng serve
EXPOSE 4200

# Lancer Angular CLI automatiquement en écoutant sur toutes les interfaces
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "2000"]
