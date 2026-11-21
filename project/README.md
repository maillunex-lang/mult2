# Учимся считать с роботом! Цифры от 1 до 10

Детский образовательный мультфильм (3 минуты) с роботом **Бип**.

## Параметры

| Параметр | Значение |
|----------|----------|
| Длительность | 180 секунд |
| Разрешение | 1920×1080 |
| FPS | 30 |
| Кадры | 5400 |
| Кодек | H.264 (yuv420p) |
| Аудио | нет |
| Файл | `output/robot_counting_1_to_10.mp4` |

## Стек

- TypeScript + node-canvas (детерминированный покадровый рендер)
- FFmpeg (сборка MP4)
- Параллельные воркеры по диапазонам кадров

## Команды

```bash
cd project
npm install
npm run render          # полный рендер 5400 кадров → MP4
npm run validate        # проверка ffprobe
npm run contact-sheet   # контактный лист 13 сцен
npm run all             # render + validate + contact-sheet
```

## Структура

```
project/
  src/characters/   # робот Бип
  src/backgrounds/  # детская комната
  src/objects/      # игрушки и цифры
  src/scenes/       # режиссура 13 сцен
  src/timeline/     # тайминг
  scripts/render/   # экспорт
  scripts/validate/ # проверки
  output/           # финальный MP4
```

## Сцены

1. Знакомство (0–15с)
2–11. Цифры 1–10
12. Повторение (148–170с)
13. Финал (170–180с)
