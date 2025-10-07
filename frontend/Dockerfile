FROM node:22-alpine

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
RUN npm install @apollo/client graphql

RUN npm install @types/node

# Copier le code source
COPY . .

# Désactiver l'analytics pour ce projet aussi
RUN ng analytics off || true

# Exposer le port dev server
EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0"]