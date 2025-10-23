from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json


@method_decorator(csrf_exempt, name='dispatch')
class LoginGraphQLView(GraphQLView):
    """
    Vue GraphQL personnalisée pour le login.
    Intercepte la réponse pour ajouter le JWT en cookie.
    """
    
    def dispatch(self, request, *args, **kwargs):
        # Exécuter la requête GraphQL normalement
        response = super().dispatch(request, *args, **kwargs)
        
        # Vérifier si un token JWT doit être mis en cookie
        if hasattr(request, '_jwt_token_set_cookie') and request._jwt_token_set_cookie:
            token = getattr(request, '_jwt_token', None)
            
            if token:
                response.set_cookie(
                    key='access_token',
                    value=token,
                    httponly=True,        # Pas accessible en JavaScript
                    secure=False,         # False en dev (HTTP), True en prod (HTTPS)
                    samesite='Lax',       # Protection CSRF
                    max_age=3600,         # 1 heure
                    path='/',             # Disponible sur tout le site
                    domain=None           # Domaine actuel
                )
                
            else:
                print("Flag _jwt_token_set_cookie présent mais pas de token")
        else:
            print("ℹPas de demande de cookie JWT (requête non-login ou échec)")
        
        return response
    
    def execute_graphql_request(self, request, data, query, *args, **kwargs):
        """Override pour logger les mutations"""
        return super().execute_graphql_request(request, data, query, *args, **kwargs)