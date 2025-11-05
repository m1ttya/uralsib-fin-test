# Docker для проекта Uralsib Fin Test

## Быстрый старт

### Запуск в Docker

```bash
# Собери образ
docker build -t uralsib-fin-test .

# Запусти контейнер
docker run -p 5173:5173 uralsib-fin-test
```

### Или через Docker Compose (удобнее)

```bash
# Запуск всех сервисов
docker-compose up

# Запуск в фоне
docker-compose up -d

# Остановка
docker-compose down
```

### Остановка и очистка

```bash
# Остановить контейнеры
docker-compose down

# Удалить образы
docker rmi uralsib-fin-test

# Полная очистка (осторожно!)
docker system prune -a
```

## Структура

- `Dockerfile` - Конфигурация образа
- `docker-compose.yml` - Оркестрация сервисов
- `.dockerignore` - Исключения для сборки

## Особенности

- **Порт**: 5173 (Vite dev server)
- **Hot reload**: Работает через volumes
- **Backend**: Готов к подключению через docker-compose

## Безопасность

Docker не изменяет твой код - это просто изолированная среда запуска.
