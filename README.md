# Lancer le build des containers :7
Pour la Dev:
```bash
docker compose -f docker-compose.dev.yml build --no-cache
```

Pour la Prod:
```bash
 docker compose build --no-cache
```
 
# Démarrer les containers :
Pour la Dev:
```bash
docker compose -f docker-compose.dev.yml up
```

Pour la Prod:
```bash
docker compose up
```
 
# Eteindre les containers :
```bash
 docker compose down -v
 ```

# Création d’un Data Model
- Après avoir créé le modèle de données dans le fichier ```models.py``` du répertoire trinity,
exécutez la commande suivante :
```bash
python manage.py makemigrations
```
Soyez attentif aux messages générés par cette commande dans le terminal, car il se peut que la migration ne puisse pas se faire correctement.
Puis
```bash
python manage.py migrate
```
# Pour accéder à une image docker :

docker exec -it django_backend bash
 
docker exec -it angular_frontend bash

# Générer la doc django

- docker exec -it django_backend bash
- sphinx-quickstart docs (docs doit déjà exister)
- sphinx-apidoc -o docs/ /app/trinity
- cd docs
- sphinx-build -b html . _build/html

# La doc angular est générée automatiquement (voir l'url http://localhost:4200/docs/)

# ATTENTION A BIEN UTILISER LES DOCKERFILE ET LE DOCKER-COMPOSE AU LIEU DES DOCKERFILE.DEV ET DOCKER-COMPOSE.DEV