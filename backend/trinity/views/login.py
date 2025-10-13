# backend/views.py
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView

class LoginGraphQLView(GraphQLView):
    # Le login ne nécessitera pas d'avoir un token déjà créé
    @csrf_exempt
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
