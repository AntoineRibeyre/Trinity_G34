#!/bin/bash
# Attendre que la base de données soit prête
echo "Waiting for DB..."
until pg_isready -h db -p 5432 -U "$POSTGRES_USER"; do
  sleep 1
done
echo "DB ready!"

# Redirect all stdout/stderr to a persistent log file while keeping console output
# This requires /var/log/trinity to exist (created in Dockerfile) and be mounted from the host
# Create a timestamped log file and update a stable symlink to the latest log
STAMP=$(date +'%d-%m-%Y-%H-%M')
LOG_FILE="/var/log/trinity/backend_${STAMP}.log"
mkdir -p /var/log/trinity
# Ensure the file exists and create/update a symlink backend.log -> backend_<timestamp>.log
touch "$LOG_FILE"
ln -sf "$LOG_FILE" /var/log/trinity/backend.log
# Redirect stdout/stderr to the timestamped log (and keep console output via tee)
exec > >(tee -a "$LOG_FILE") 2>&1

# Créer un fichier de migration
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer les utilisateurs de test
#python manage.py create_test_users

# Lancer le serveur Django
python manage.py runserver 0.0.0.0:8000
