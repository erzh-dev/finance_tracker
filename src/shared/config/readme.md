# Логика взаимодействия с API

Обычно содержит

- инстансы для работы с разными внешними API
- методы / фабрики для вызова конкретных эндпоинтов
В редких случаях (react-query / graphql) сами запросы могут лежать рядом с местом использования

Но чаще всего рекоммендуется располагать API-сегмент в shared-слое, чтобы снизить количество переплетений логики
При этом, данный сегмент может как писаться вручную, так и генерироваться с помощью схемы API

https://feature-sliced.design/docs/reference/segments#api