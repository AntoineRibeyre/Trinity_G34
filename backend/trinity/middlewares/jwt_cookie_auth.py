from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import User, AnonymousUser
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()
class JWTAuthenticationMiddleware(MiddlewareMixin):
    """Middleware pour authentifier l'utilisateur via le JWT dans les cookies"""
    
    def process_request(self, request):
        token = request.COOKIES.get("access_token")
        print(f"Path: {request.path}")
        print(f"access_token reçu : {token[:50] if token else None}...")

        # IMPORTANT : Si pas de token, créer un utilisateur anonyme
        if not token:
            print("Pas de token, utilisateur anonyme")
            if not hasattr(request, 'user') or request.user is None:
                request.user = AnonymousUser()
            return

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            print(f"payload décodé : {payload}")

            user_id = payload.get("user_id")
            if user_id:
                try:
                    request.user = User.objects.get(id=user_id)
                    print(f"utilisateur trouvé : {request.user}")
                except User.DoesNotExist:
                    print(f"User ID {user_id} n'existe pas")
                    request.user = AnonymousUser()
            else:
                print("Pas de user_id dans le payload")
                request.user = AnonymousUser()
                
        except jwt.ExpiredSignatureError:
            print("Token expiré")
            request.user = AnonymousUser()
        except jwt.DecodeError as e:
            print(f"Erreur décodage JWT : {e}")
            request.user = AnonymousUser()
        except Exception as e:
            print(f"Erreur middleware JWT : {e}")
            request.user = AnonymousUser()


class JWTCookieMiddleware(MiddlewareMixin):
    """Middleware pour ajouter le JWT en cookie après la mutation tokenAuth"""
    
    def process_response(self, request, response):
        print("JWTCookieMiddleware appelé")
        print(f"Attributs request: {dir(request)}")
        print(f"Has _jwt_token_set_cookie: {hasattr(request, '_jwt_token_set_cookie')}")
        
        # Vérifier si la mutation a demandé de set le cookie
        if hasattr(request, '_jwt_token_set_cookie') and request._jwt_token_set_cookie:
            token = getattr(request, '_jwt_token', None)
            
            if token:
                print("Ajout du cookie access_token dans la réponse")
                response.set_cookie(
                    key='access_token',
                    value=token,
                    httponly=True,
                    secure=False,        # False en dev, True en production avec HTTPS
                    samesite='Lax',      # Lax pour same-site, None pour cross-site (nécessite secure=True)
                    max_age=3600,        # 1 heure
                    path='/',
                    domain=None          # None = domaine actuel
                )
            else:
                print("_jwt_token_set_cookie est True mais pas de token trouvé")
        else:
            print("Pas de demande de set cookie")
        
        return response