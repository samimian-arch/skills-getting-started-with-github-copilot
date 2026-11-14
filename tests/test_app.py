import pytest
from fastapi.testclient import TestClient

import src.app as app_module


@pytest.fixture
def activity_data(monkeypatch):
    activities = {
        "Chess Club": {
            "description": "Play chess",
            "schedule": "Fridays",
            "max_participants": 12,
            "participants": ["existing@example.com"],
        },
        "Art Club": {
            "description": "Make art",
            "schedule": "Mondays",
            "max_participants": 16,
            "participants": [],
        },
    }
    monkeypatch.setattr(app_module, "activities", activities)
    return activities


@pytest.fixture
def client(activity_data):
    with TestClient(app_module.app) as test_client:
        yield test_client


def test_list_activities(client, activity_data):
    # Arrange
    expected = activity_data

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json() == expected


def test_signup_adds_participant(client, activity_data):
    # Arrange
    email = "new@example.com"

    # Act
    response = client.post("/activities/Chess Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for Chess Club"}
    assert activity_data["Chess Club"]["participants"] == ["existing@example.com", email]
    assert activity_data["Art Club"]["participants"] == []


def test_signup_rejects_duplicate(client, activity_data):
    # Arrange
    email = "existing@example.com"

    # Act
    response = client.post("/activities/Chess Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json() == {"detail": "Student already signed up for this activity"}
    assert activity_data["Chess Club"]["participants"] == [email]


def test_signup_rejects_unknown_activity(client, activity_data):
    # Arrange
    email = "new@example.com"

    # Act
    response = client.post("/activities/Unknown/signup", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}
    assert activity_data["Chess Club"]["participants"] == ["existing@example.com"]
    assert activity_data["Art Club"]["participants"] == []


def test_unregister_removes_participant(client, activity_data):
    # Arrange
    email = "existing@example.com"

    # Act
    response = client.delete("/activities/Chess Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {email} from Chess Club"}
    assert activity_data["Chess Club"]["participants"] == []


def test_unregister_rejects_missing_participant(client, activity_data):
    # Arrange
    email = "missing@example.com"

    # Act
    response = client.delete("/activities/Chess Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Student is not signed up for this activity"}
    assert activity_data["Chess Club"]["participants"] == ["existing@example.com"]


def test_unregister_rejects_unknown_activity(client, activity_data):
    # Arrange
    email = "existing@example.com"

    # Act
    response = client.delete("/activities/Unknown/signup", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}
    assert activity_data["Chess Club"]["participants"] == [email]
