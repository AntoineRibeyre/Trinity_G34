from datetime import datetime, timedelta, timezone
from calendar import timegm


def jwt_payload(user, context=None):
    """
    Génère un payload JWT personnalisé avec user_id, email et username
    """
    # Créer les timestamps Unix (pas des objets datetime)
    # now = datetime.utcnow()
    now = datetime.now(timezone.utc)
    expiration = now + timedelta(hours=1)

    return {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'exp': timegm(expiration.utctimetuple()),  # Convertir en timestamp Unix
        'origIat': timegm(now.utctimetuple()),     # Convertir en timestamp Unix
    }