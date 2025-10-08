FROM python:3.12-slim

# Variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Installer dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    postgresql-client \
    git \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier l'entrypoint et donner les droits
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copier le code source et donner les permissions
COPY . .
RUN chown -R appuser:appuser /app

# Changer vers l'utilisateur non-root
USER appuser

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]