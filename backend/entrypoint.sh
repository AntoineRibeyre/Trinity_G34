#!/bin/bash
# Attendre que la base de données soit prête
echo "Waiting for DB..."
until pg_isready -h db -p 5432 -U "$POSTGRES_USER"; do
  sleep 1
done
echo "DB ready!"

# Appliquer les migrations
python manage.py migrate

# Lancer le serveur Django
python manage.py runserver 0.0.0.0:8000
