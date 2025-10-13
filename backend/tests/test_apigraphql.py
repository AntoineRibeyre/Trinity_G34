import pytest
from graphene.test import Client
import trinity.schema as my_schema

@pytest.mark.snapshot
def test_pointage_arrivee(snapshot):
    client = Client(my_schema.schema)
    query = """
    query {
      pointageArrivee(userId: 1) {
        datetimeField
        durationField
      }
    }
    """

    executed = client.execute(query)

    # On compare le résultat au snapshot enregistré
    snapshot.assert_match(executed)