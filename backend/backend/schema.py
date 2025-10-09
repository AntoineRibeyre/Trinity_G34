import graphene
from trinity import schema


class Query(schema.Query):
    pass


schema = graphene.Schema(query=Query)