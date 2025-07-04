# Project: TICKET SYSTEM

1. admin authomatic created
2. token authomatic created with login

![Image](https://github.com/user-attachments/assets/4f9a4e5e-c11e-43e9-b92c-ada10905861b)

## Running

### 1. LOCAL

backend

- use sqlite like a db
- use uv and python to local backend

```link
  https://docs.astral.sh/uv/getting-started/installation/
```

```bash
cd backend
uv pip install .[dev,test]
uv run python src/manage.py makemigrations
uv run python src/manage.py migrate
uv run python src/manage.py runserver
```

frontend

- you need node and npm

```link
  https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
```

```bash
cd frontend
npm start
```

### 2. DOCKER

- use postgres like a db

```bash
docker compose --profile dev up --build -d
```

logs

- docker attach web
- docker attach front

exec

- docker exec -it web sh
- docker exec -it front sh

```txt
http://127.0.0.1:8000/admin/
http://127.0.0.1:8000/api/...
http://127.0.0.1:3000
```

## Backend

```txt
POST
{
  "username": "a",
  "password": "aaaaa",
  "auto": "false"
}
OR
{
  "username": "a",
  "password": "aaaaa"
}
OR
{
  "auto": "true"
}
http://127.0.0.1:8000/api/auth/login/
```

```txt
POST
http://127.0.0.1:8000/api/auth/logout/
```

```txt
POST
{
  "username": "a",
  "password": "aaaaa",
  "email": "a@a.com"
}
http://127.0.0.1:8000/api/auth/create_superuser/
```

```txt
GET
http://127.0.0.1:8000/api/tickets/:ticket_id/
```

```txt
GET
http://127.0.0.1:8000/api/tickets/
```

```txt
POST
{
  "title": "Some title4",
  "description": "Lorem dasdsadsadsadsadassda"
}
http://127.0.0.1:8000/api/tickets/
```

```txt
PUT
{
  "title": "Some title",
  "description": "Lorem dasdsadsadsadsadassda",
  "status": "in_progress"
}
http://127.0.0.1:8000/api/tickets/:ticket_id/
```

```txt
PATCH
{
  "status": "in_progress"
}
http://127.0.0.1:8000/api/tickets/:ticket_id/
```

```txt
DELETE
http://127.0.0.1:8000/api/tickets/:ticket_id/
```

## Tests

1. local

```bash
cd backend
uv run pytest -v -s
```

OR docker

```bash
docker exec -it web sh
pytest -v -s
```

```bash
cd frontend
npm test
```

### OTHER IMAGES

![Image](https://github.com/user-attachments/assets/d5628365-10af-46cb-bd6f-1faa0ca6f46b)

![Image](https://github.com/user-attachments/assets/be1bd7bf-af40-4216-bd1b-78584e28f2da)
