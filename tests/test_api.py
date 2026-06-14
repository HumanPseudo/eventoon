from datetime import date, timedelta

from httpx import AsyncClient


class TestEvents:
    today = date.today()
    event_data = {
        "name": "Tech Conference",
        "description": "A tech conference",
        "date": str(today + timedelta(days=30)),
        "max_capacity": 100,
    }

    async def test_health(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}

    async def test_create_event(self, client: AsyncClient):
        resp = await client.post("/events", json=self.event_data)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == self.event_data["name"]
        assert data["description"] == self.event_data["description"]
        assert data["date"] == self.event_data["date"]
        assert data["max_capacity"] == 100
        assert "id" in data

    async def test_list_events_empty(self, client: AsyncClient):
        resp = await client.get("/events")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_events(self, client: AsyncClient):
        await client.post("/events", json=self.event_data)
        resp = await client.get("/events")
        assert resp.status_code == 200
        events = resp.json()
        assert len(events) == 1
        assert events[0]["name"] == self.event_data["name"]

    async def test_create_then_list(self, client: AsyncClient):
        await client.post("/events", json=self.event_data)
        await client.post(
            "/events",
            json={
                **self.event_data,
                "name": "Workshop",
                "date": str(self.today + timedelta(days=60)),
            },
        )
        resp = await client.get("/events")
        assert len(resp.json()) == 2
        names = {e["name"] for e in resp.json()}
        assert names == {"Tech Conference", "Workshop"}

    async def test_get_event(self, client: AsyncClient):
        create_resp = await client.post("/events", json=self.event_data)
        event_id = create_resp.json()["id"]
        resp = await client.get(f"/events/{event_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == self.event_data["name"]
        assert resp.json()["id"] == event_id

    async def test_get_event_not_found(self, client: AsyncClient):
        resp = await client.get("/events/9999")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    async def test_register_attendee(self, client: AsyncClient):
        create_resp = await client.post("/events", json=self.event_data)
        event_id = create_resp.json()["id"]
        register_data = {"user_name": "Alice", "email": "alice@example.com"}
        resp = await client.post(f"/events/{event_id}/register", json=register_data)
        assert resp.status_code == 201
        data = resp.json()
        assert data["user_name"] == "Alice"
        assert data["email"] == "alice@example.com"
        assert data["event_id"] == event_id
        assert "id" in data
        assert "registration_date" in data

    async def test_register_nonexistent_event(self, client: AsyncClient):
        resp = await client.post(
            "/events/9999/register",
            json={"user_name": "Alice", "email": "alice@example.com"},
        )
        assert resp.status_code == 404

    async def test_register_duplicate_email(self, client: AsyncClient):
        create_resp = await client.post("/events", json=self.event_data)
        event_id = create_resp.json()["id"]
        data = {"user_name": "Alice", "email": "alice@example.com"}
        await client.post(f"/events/{event_id}/register", json=data)
        resp = await client.post(f"/events/{event_id}/register", json=data)
        assert resp.status_code == 400
        assert "email" in resp.json()["detail"].lower()

    async def test_max_capacity(self, client: AsyncClient):
        create_resp = await client.post(
            "/events", json={**self.event_data, "max_capacity": 2}
        )
        event_id = create_resp.json()["id"]
        await client.post(
            f"/events/{event_id}/register",
            json={"user_name": "A", "email": "a@test.com"},
        )
        await client.post(
            f"/events/{event_id}/register",
            json={"user_name": "B", "email": "b@test.com"},
        )
        resp = await client.post(
            f"/events/{event_id}/register",
            json={"user_name": "C", "email": "c@test.com"},
        )
        assert resp.status_code == 400
        assert "capacity" in resp.json()["detail"].lower()

    async def test_duplicate_email_different_events(self, client: AsyncClient):
        r1 = await client.post("/events", json=self.event_data)
        r2 = await client.post(
            "/events",
            json={
                **self.event_data,
                "name": "Another Event",
                "date": str(self.today + timedelta(days=60)),
            },
        )
        data = {"user_name": "Alice", "email": "alice@example.com"}
        resp1 = await client.post(f"/events/{r1.json()['id']}/register", json=data)
        assert resp1.status_code == 201
        resp2 = await client.post(f"/events/{r2.json()['id']}/register", json=data)
        assert resp2.status_code == 201

    async def test_stats_empty(self, client: AsyncClient):
        create_resp = await client.post("/events", json=self.event_data)
        event_id = create_resp.json()["id"]
        resp = await client.get(f"/events/{event_id}/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == event_id
        assert data["name"] == self.event_data["name"]
        assert data["total_registrations"] == 0
        assert data["max_capacity"] == 100

    async def test_stats_with_registrations(self, client: AsyncClient):
        create_resp = await client.post("/events", json=self.event_data)
        event_id = create_resp.json()["id"]
        await client.post(
            f"/events/{event_id}/register",
            json={"user_name": "A", "email": "a@test.com"},
        )
        await client.post(
            f"/events/{event_id}/register",
            json={"user_name": "B", "email": "b@test.com"},
        )
        resp = await client.get(f"/events/{event_id}/stats")
        assert resp.json()["total_registrations"] == 2

    async def test_stats_nonexistent_event(self, client: AsyncClient):
        resp = await client.get("/events/9999/stats")
        assert resp.status_code == 404

    async def test_create_event_future_date(self, client: AsyncClient):
        past = str(self.today - timedelta(days=10))
        resp = await client.post(
            "/events",
            json={**self.event_data, "date": past},
        )
        assert resp.status_code == 201

    async def test_request_validation(self, client: AsyncClient):
        resp = await client.post("/events", json={"name": "Incomplete"})
        assert resp.status_code == 422
