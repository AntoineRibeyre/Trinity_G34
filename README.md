# Lancer le build des containers :7
Pour la Dev:
```bash
docker compose -f docker-compose.dev.yml build --no-cache
```

Pour la Prod:
```bash
 docker compose -f docker-compose.yml build --no-cache
```
 
# Démarrer les containers :
Pour la Dev:
```bash
docker compose -f docker-compose.dev.yml up
```

Pour la Prod:
```bash
docker compose -f docker-compose.yml up
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


# Charger les données du dump
- se rendre dans le conteneur du backend
- exécuter la commande python manage.py loaddata trinity/dump/data.json

## Logs

During development the backend and frontend containers write their runtime output to files mounted on the host under `./logs`:

- `./logs/backend/backend.log`  — captured output from `django_backend` (migrations, server, etc.)
- `./logs/frontend/frontend.log` — captured output from `angular_frontend` (`ng serve`).

These files are created when running `docker compose -f docker-compose.dev.yml up` and are ignored by git.

Note: these logs are not rotated by default and can grow over time; for long-running dev environments consider adding a host `logrotate` job or integrating a log rotation solution into the containers.

