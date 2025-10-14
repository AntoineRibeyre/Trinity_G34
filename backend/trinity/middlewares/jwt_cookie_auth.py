import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.deprecation import MiddlewareMixin
from jwt import InvalidTokenError, ExpiredSignatureError

User = get_user_model()

class JWTAuthenticationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        token = request.COOKIES.get("access_token")
        print("🔹 access_token reçu :", token)  # 👈 ajoute ceci

        if not token:
            return

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            print("🔹 payload décodé :", payload)  # 👈 ajoute ceci

            user_id = payload.get("user_id")
            if user_id:
                request.user = User.objects.get(id=user_id)
                print("🔹 utilisateur trouvé :", request.user)
        except Exception as e:
            print("❌ erreur middleware JWT :", e)
            request.user = None

