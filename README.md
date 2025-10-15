# Lancer le build des containers :7
```bash
 docker compose build --no-cache
```
 
# Démarrer les containers :
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